import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { provisionServiceInstance } from '@/lib/services/provisioning';
import { activateManagedPlanSubscription } from '@/lib/billing/managed-plan-settlement';
import { markManagedPlanRenewalFailed, recordManagedPlanRenewal } from '@/lib/billing/managed-plan-renewal';

export const runtime = 'nodejs';

async function findFlutterwaveSubscriptionByTransaction(transactionId: string | number, secret: string) {
  const url = new URL('https://api.flutterwave.com/v3/subscriptions');
  url.searchParams.set('transaction_id', String(transactionId));
  const response = await fetch(url, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || result?.status !== 'success') throw new Error('FLUTTERWAVE_SUBSCRIPTION_LOOKUP_FAILED');
  const matches = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
  if (matches.length !== 1 || matches[0]?.id == null) return null;
  return { id: String(matches[0].id), nextBillingAt: typeof matches[0].next_due_date === 'string' ? matches[0].next_due_date : null };
}


export async function POST(request: Request) {
  const secretHash = process.env.FLW_SECRET_HASH;
  if (!secretHash) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });
  const signature = request.headers.get('flutterwave-signature') ?? request.headers.get('verif-hash');
  const signatureBytes = Buffer.from(signature ?? '', 'utf8');
  const secretBytes = Buffer.from(secretHash, 'utf8');
  if (!signature || signatureBytes.length !== secretBytes.length || !crypto.timingSafeEqual(signatureBytes, secretBytes)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  try {
    const payload = await request.json() as { id?: string; type?: string; event?: string; data?: Record<string, any> };
    const data = payload.data ?? {};
    const reference = typeof data.tx_ref === 'string' ? data.tx_ref : null;
    const customerEmail = typeof data.customer?.email === 'string' ? data.customer.email.toLowerCase() : null;
    const eventType = payload.type ?? payload.event ?? 'unknown';
    const stableEventKey = payload.id ?? data.id ?? reference
      ?? (eventType === 'subscription.cancelled' && customerEmail && data.plan?.id != null
        ? `${customerEmail}:${String(data.plan.id)}:${String(data.status ?? 'cancelled')}`
        : null);
    if (stableEventKey == null) return NextResponse.json({ error: 'Webhook event has no stable provider identifier.' }, { status: 400 });
    const eventId = `${eventType}:${String(stableEventKey)}`;
    const admin = createAdminSupabaseClient();
    const { data: claimed, error: claimError } = await admin.rpc('claim_billing_webhook_event', {
      p_provider: 'flutterwave',
      p_event_id: eventId,
      p_event_type: eventType,
      p_payload: payload,
    });
    if (claimError) throw claimError;
    if (claimed !== true) {
      const { data: priorEvent, error: priorEventError } = await admin.from('billing_webhook_events')
        .select('processed').eq('provider', 'flutterwave').eq('event_id', eventId).maybeSingle();
      if (priorEventError) throw priorEventError;
      if (priorEvent?.processed) return NextResponse.json({ received: true, duplicate: true });
      // A live processing lease is not an acknowledgement. Ask the provider to retry.
      return NextResponse.json({ error: 'Webhook event is still being processed. Please retry.' }, { status: 409 });
    }

    if (eventType === 'subscription.cancelled') {
      const providerSubscriptionId = data.subscription_id != null
        ? String(data.subscription_id)
        : data.subscription?.id != null ? String(data.subscription.id) : null;
      let credential: { subscription_id: string | null } | null = null;
      if (providerSubscriptionId) {
        const { data, error } = await admin.from('billing_subscription_provider_credentials')
          .select('subscription_id').eq('provider', 'flutterwave')
          .eq('provider_subscription_id', providerSubscriptionId).maybeSingle();
        if (error) throw error;
        credential = data;
      } else if (customerEmail && data.plan?.id != null) {
        // Flutterwave's documented cancellation payload omits the subscription ID.
        // Match only when email + exact plan identifies one HostSuite mandate.
        const { data: matches, error } = await admin.from('billing_subscription_provider_credentials')
          .select('subscription_id')
          .eq('provider', 'flutterwave')
          .eq('provider_customer_email', customerEmail)
          .eq('provider_plan_id', String(data.plan.id))
          .limit(2);
        if (error) throw error;
        if (matches?.length === 1) credential = matches[0];
      }
      if (credential?.subscription_id) {
        const { data: subscription, error: subscriptionError } = await admin.from('billing_subscriptions')
          .select('id,current_period_end')
          .eq('id', credential.subscription_id).maybeSingle();
        if (subscriptionError) throw subscriptionError;
        if (subscription) {
          const paidThrough = subscription.current_period_end && new Date(subscription.current_period_end) > new Date();
          const { error } = await admin.from('billing_subscriptions').update({
            auto_renew: false,
            cancel_at_period_end: true,
            status: paidThrough ? 'active' : 'cancelled',
            cancelled_at: new Date().toISOString(),
          }).eq('id', subscription.id);
          if (error) throw error;
        }
      }
      // Ambiguous provider cancellation events are intentionally not mapped to a customer subscription.
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'flutterwave').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    if (eventType !== 'charge.completed' || !reference || data.id == null) {
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'flutterwave').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    const secret = process.env.FLW_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });
    const verify = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(data.id))}/verify`, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' });
    const result = await verify.json();
    const transaction = result?.data;
    if (!verify.ok || result?.status !== 'success' || transaction?.tx_ref !== reference) throw new Error('Flutterwave transaction verification failed.');
    if (transaction?.status !== 'successful' && !['failed', 'cancelled'].includes(String(transaction?.status))) {
      await admin.from('billing_webhook_events').update({ processing_started_at: null }).eq('provider', 'flutterwave').eq('event_id', eventId).eq('processed', false);
      return NextResponse.json({ error: 'Flutterwave transaction is not in a final state yet.' }, { status: 409 });
    }

    const { data: order } = await admin.from('billing_orders')
      .select('id,user_id,total,currency,metadata,status,paid_at,provider')
      .eq('provider', 'flutterwave')
      .eq('provider_reference', reference)
      .maybeSingle();

    if (transaction?.status !== 'successful') {
      if (order) {
        const { error: orderError } = await admin.from('billing_orders').update({ status: 'failed' }).eq('id', order.id).eq('status', 'pending');
        if (orderError) throw orderError;
        const { error: invoiceError } = await admin.from('billing_invoices').update({ status: 'void' }).eq('order_id', order.id).eq('status', 'open');
        if (invoiceError) throw invoiceError;
      } else {
        const failedSubscription = await findFlutterwaveSubscriptionByTransaction(data.id, secret);
        if (failedSubscription?.id) {
          await markManagedPlanRenewalFailed({
            provider: 'flutterwave',
            providerSubscriptionId: failedSubscription.id,
            amount: Number.isFinite(Number(transaction?.amount ?? data.amount)) && Number(transaction?.amount ?? data.amount) > 0 ? Number(transaction?.amount ?? data.amount) : null,
            reason: transaction?.processor_response ?? transaction?.status ?? 'Flutterwave could not collect the recurring payment.',
          });
        }
      }
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'flutterwave').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    if (order && (Number(transaction.amount) !== Number(order.total) || transaction.currency !== order.currency)) {
      return NextResponse.json({ error: 'Payment amount or currency mismatch.' }, { status: 400 });
    }
    if (order && transaction.meta?.order_id && transaction.meta.order_id !== order.id) return NextResponse.json({ error: 'Payment order reference mismatch.' }, { status: 400 });
    if (order && transaction.meta?.user_id && transaction.meta.user_id !== order.user_id) return NextResponse.json({ error: 'Payment customer mismatch.' }, { status: 400 });

    const now = new Date().toISOString();
    if (order) {
      if (order.metadata?.source === 'ticket_quote') {
        const { data: settlement, error: settlementError } = await admin.rpc('settle_ticket_quote_payment', { p_order_id: order.id });
        if (settlementError) throw settlementError;
        if (settlement === 'stale_payment' || settlement === 'order_not_payable') {
          await admin.from('billing_webhook_events').update({ processed: true, processed_at: now }).eq('provider', 'flutterwave').eq('event_id', eventId);
          return NextResponse.json({ received: true, reconciliation: 'required' });
        }
        await admin.from('billing_webhook_events').update({ processed: true, processed_at: now }).eq('provider', 'flutterwave').eq('event_id', eventId);
        return NextResponse.json({ received: true, ticketQuote: settlement });
      }

      const { data: settlementState, error: settlementError } = await admin.rpc('settle_verified_billing_order', {
        p_order_id: order.id,
        p_provider: 'flutterwave',
        p_provider_reference: reference,
        p_amount: Number(transaction.amount),
        p_currency: transaction.currency,
      });
      if (settlementError) throw settlementError;
      if (settlementState === 'reconciliation_required') {
        await admin.from('billing_orders').update({ metadata: { ...(order.metadata ?? {}), needs_manual_reconciliation: true, reconciliation_reason: 'Verified Flutterwave payment arrived for a non-payable order.', reconciliation_marked_at: now } }).eq('id', order.id);
        await admin.from('billing_webhook_events').update({ processed: true, processed_at: now }).eq('provider', 'flutterwave').eq('event_id', eventId);
        return NextResponse.json({ received: true, reconciliation: 'required' });
      }

      let providerSubscription: { id: string; nextBillingAt: string | null } | null = null;
      if (order.metadata?.auto_renew === true && customerEmail && typeof order.metadata.provider_plan_id === 'string') {
        // Resolve the mandate from this exact verified transaction, not email + plan alone.
        providerSubscription = await findFlutterwaveSubscriptionByTransaction(data.id, secret);
      }
      const managedPlan = await activateManagedPlanSubscription({ ...order, paid_at: now }, {
        id: providerSubscription?.id ?? null,
        customerEmail,
        planId: order.metadata?.provider_plan_id,
        nextBillingAt: providerSubscription?.nextBillingAt ?? null,
      });
      if (!managedPlan) {
        const { error: entitlementError } = await admin.rpc('grant_billing_order_value', { p_order_id: order.id });
        if (entitlementError) throw entitlementError;
        const { error: serviceInstanceError } = await admin.rpc('create_service_instances_for_order', { p_order_id: order.id });
        if (serviceInstanceError) throw serviceInstanceError;
        const { data: instances, error: instancesError } = await admin.from('service_instances').select('id').eq('order_id', order.id).eq('status', 'paid');
        if (instancesError) throw instancesError;
        for (const instance of instances ?? []) await provisionServiceInstance(instance.id);
      }
    } else {
      if (!customerEmail) return NextResponse.json({ error: 'Recurring payment customer could not be identified.' }, { status: 409 });
      const providerSubscription = await findFlutterwaveSubscriptionByTransaction(data.id, secret);
      let providerCredential: { subscription_id: string; provider_subscription_id: string | null } | null = null;
      if (providerSubscription?.id) {
        const { data: credential, error: credentialError } = await admin.from('billing_subscription_provider_credentials')
          .select('subscription_id,provider_subscription_id')
          .eq('provider', 'flutterwave')
          .eq('provider_subscription_id', providerSubscription.id)
          .maybeSingle();
        if (credentialError) throw credentialError;
        providerCredential = credential;
      }
      // Never infer a recurring mandate from customer email and amount alone.
      // If transaction-to-subscription lookup fails, leave it for manual reconciliation.
      if (!providerCredential?.provider_subscription_id) {
        return NextResponse.json({ error: 'Recurring payment could not be matched unambiguously to a HostSuite subscription.' }, { status: 409 });
      }
      const settled = await recordManagedPlanRenewal({
        provider: 'flutterwave',
        providerSubscriptionId: providerCredential.provider_subscription_id,
        reference,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        paidAt: now,
        nextBillingAt: providerSubscription?.nextBillingAt ?? null,
      });
      if (!settled) return NextResponse.json({ error: 'Recurring subscription could not be matched to a HostSuite account.' }, { status: 409 });
    }

    await admin.from('billing_webhook_events').update({ processed: true, processed_at: now }).eq('provider', 'flutterwave').eq('event_id', eventId);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Flutterwave webhook processing failed', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
