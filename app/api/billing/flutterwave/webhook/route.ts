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
  return matches[0]?.id != null ? String(matches[0].id) : null;
}

async function findFlutterwaveSubscription(email: string, planId: string, secret: string) {
  const url = new URL('https://api.flutterwave.com/v3/subscriptions');
  url.searchParams.set('email', email);
  url.searchParams.set('plan', planId);
  url.searchParams.set('status', 'active');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || result?.status !== 'success') throw new Error('FLUTTERWAVE_SUBSCRIPTION_LOOKUP_FAILED');
  const matches = Array.isArray(result.data) ? result.data : [];
  const match = matches.find((item: any) => String(item.plan?.id ?? item.plan_id ?? '') === planId && String(item.customer?.email ?? item.email ?? '').toLowerCase() === email.toLowerCase());
  return match?.id != null ? String(match.id) : null;
}

export async function POST(request: Request) {
  const secretHash = process.env.FLW_SECRET_HASH;
  if (!secretHash) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });
  const signature = request.headers.get('flutterwave-signature') ?? request.headers.get('verif-hash');
  if (!signature || signature !== secretHash) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });

  try {
    const payload = await request.json() as { id?: string; type?: string; event?: string; data?: Record<string, any> };
    const data = payload.data ?? {};
    const reference = typeof data.tx_ref === 'string' ? data.tx_ref : null;
    const customerEmail = typeof data.customer?.email === 'string' ? data.customer.email.toLowerCase() : null;
    const eventType = payload.type ?? payload.event ?? 'unknown';
    const eventId = String(payload.id ?? data.id ?? reference ?? `${eventType}:${customerEmail ?? crypto.randomUUID()}`);
    const admin = createAdminSupabaseClient();
    const { data: existing } = await admin.from('billing_webhook_events').select('processed').eq('provider', 'flutterwave').eq('event_id', eventId).maybeSingle();
    if (existing?.processed) return NextResponse.json({ received: true });

    await admin.from('billing_webhook_events').upsert({ provider: 'flutterwave', event_id: eventId, event_type: eventType, signature_valid: true, payload }, { onConflict: 'provider,event_id' });

    if (eventType === 'subscription.cancelled') {
      const planId = data.plan?.id != null ? String(data.plan.id) : null;
      if (customerEmail && planId) {
        const { data: credentials, error: lookupError } = await admin.from('billing_subscription_provider_credentials')
          .select('subscription_id')
          .eq('provider', 'flutterwave')
          .eq('provider_customer_email', customerEmail)
          .eq('provider_plan_id', planId)
          .limit(2);
        if (lookupError) throw lookupError;
        if (credentials?.length === 1 && credentials[0].subscription_id) {
          const { data: subscription, error: subscriptionError } = await admin.from('billing_subscriptions')
            .select('id,current_period_end')
            .eq('id', credentials[0].subscription_id)
            .maybeSingle();
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
      }
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
    if (!verify.ok || result?.status !== 'success') throw new Error('Flutterwave transaction verification failed.');

    const { data: order } = await admin.from('billing_orders')
      .select('id,user_id,total,currency,metadata,status,paid_at,provider')
      .eq('provider', 'flutterwave')
      .eq('provider_reference', reference)
      .maybeSingle();

    if (transaction?.status !== 'successful') {
      if (!order && customerEmail) {
        await markManagedPlanRenewalFailed({
          provider: 'flutterwave',
          customerEmail,
          amount: Number.isFinite(Number(transaction?.amount ?? data.amount)) && Number(transaction?.amount ?? data.amount) > 0 ? Number(transaction?.amount ?? data.amount) : null,
          reason: transaction?.processor_response ?? transaction?.status ?? 'Flutterwave could not collect the recurring payment.',
        });
      }
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'flutterwave').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    if (order && (Number(transaction.amount) !== Number(order.total) || transaction.currency !== order.currency)) {
      return NextResponse.json({ error: 'Payment amount or currency mismatch.' }, { status: 400 });
    }

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

      const { error: orderError } = await admin.from('billing_orders').update({ status: 'paid', paid_at: now }).eq('id', order.id);
      if (orderError) throw orderError;
      const { error: invoiceError } = await admin.from('billing_invoices').update({ status: 'paid', paid_at: now }).eq('order_id', order.id);
      if (invoiceError) throw invoiceError;

      let providerSubscriptionId: string | null = null;
      if (order.metadata?.auto_renew === true && customerEmail && typeof order.metadata.provider_plan_id === 'string') {
        providerSubscriptionId = await findFlutterwaveSubscription(customerEmail, order.metadata.provider_plan_id, secret);
      }
      const managedPlan = await activateManagedPlanSubscription({ ...order, paid_at: now }, {
        id: providerSubscriptionId,
        customerEmail,
        planId: order.metadata?.provider_plan_id,
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
      const providerSubscriptionId = await findFlutterwaveSubscriptionByTransaction(data.id, secret);
      let providerCredential: { subscription_id: string; provider_subscription_id: string | null } | null = null;
      if (providerSubscriptionId) {
        const { data: credential, error: credentialError } = await admin.from('billing_subscription_provider_credentials')
          .select('subscription_id,provider_subscription_id')
          .eq('provider', 'flutterwave')
          .eq('provider_subscription_id', providerSubscriptionId)
          .maybeSingle();
        if (credentialError) throw credentialError;
        providerCredential = credential;
      }
      if (!providerCredential && customerEmail) {
        const { data: credentials, error: credentialsError } = await admin.from('billing_subscription_provider_credentials')
          .select('subscription_id,provider_subscription_id')
          .eq('provider', 'flutterwave')
          .eq('provider_customer_email', customerEmail)
          .limit(20);
        if (credentialsError) throw credentialsError;
        const subscriptionIds = (credentials ?? []).map((item) => item.subscription_id).filter(Boolean);
        if (subscriptionIds.length) {
          const { data: matches, error: matchError } = await admin.from('billing_subscriptions')
            .select('id')
            .in('id', subscriptionIds)
            .eq('auto_renew', true)
            .eq('amount', Number(transaction.amount))
            .eq('currency', transaction.currency)
            .limit(2);
          if (matchError) throw matchError;
          if (matches?.length === 1) {
            providerCredential = credentials?.find((item) => item.subscription_id === matches[0].id) ?? null;
          }
        }
      }
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
