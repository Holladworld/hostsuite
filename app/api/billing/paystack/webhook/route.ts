import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { provisionServiceInstance } from '@/lib/services/provisioning';
import { activateManagedPlanSubscription } from '@/lib/billing/managed-plan-settlement';
import { markManagedPlanRenewalFailed, recordManagedPlanRenewal } from '@/lib/billing/managed-plan-renewal';

export const runtime = 'nodejs';

function validSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get('x-paystack-signature'), secret)) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });

  try {
    const payload = JSON.parse(rawBody) as { event?: string; data?: Record<string, any> };
    const data = payload.data ?? {};
    const reference = typeof data.reference === 'string' ? data.reference : (typeof data.transaction?.reference === 'string' ? data.transaction.reference : null);
    const subscriptionData = data.subscription ?? data;
    const subscriptionCode = typeof subscriptionData.subscription_code === 'string' ? subscriptionData.subscription_code : null;
    const eventId = `${payload.event ?? 'unknown'}:${reference ?? data.invoice_code ?? subscriptionCode ?? String(data.id ?? crypto.randomUUID())}`;
    const admin = createAdminSupabaseClient();

    const { data: existing } = await admin.from('billing_webhook_events').select('processed').eq('provider', 'paystack').eq('event_id', eventId).maybeSingle();
    if (existing?.processed) return NextResponse.json({ received: true });

    await admin.from('billing_webhook_events').upsert({ provider: 'paystack', event_id: eventId, event_type: payload.event ?? 'unknown', signature_valid: true, payload }, { onConflict: 'provider,event_id' });

    if (payload.event === 'subscription.create') {
      const planCode = subscriptionData.plan?.plan_code ?? data.plan?.plan_code;
      const customerEmail = subscriptionData.customer?.email ?? data.customer?.email;
      const providerCode = subscriptionCode ?? (typeof data.subscription_code === 'string' ? data.subscription_code : null);
      const emailToken = subscriptionData.email_token ?? data.email_token;
      if (providerCode && typeof planCode === 'string' && typeof customerEmail === 'string') {
        const normalizedEmail = customerEmail.toLowerCase();
        const { data: order, error } = await admin.from('billing_orders')
          .select('id,status')
          .eq('provider', 'paystack')
          .eq('metadata->>source', 'managed_plan')
          .eq('metadata->>provider_plan_id', planCode)
          .eq('metadata->>customer_email', normalizedEmail)
          .in('status', ['pending', 'paid'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (order) {
          const { data: linkedSubscription, error: subscriptionLookupError } = await admin.from('billing_subscriptions')
            .select('id')
            .eq('source_order_id', order.id)
            .maybeSingle();
          if (subscriptionLookupError) throw subscriptionLookupError;
          const { error: credentialError } = await admin.from('billing_subscription_provider_credentials').upsert({
            order_id: order.id,
            subscription_id: linkedSubscription?.id ?? null,
            provider: 'paystack',
            provider_subscription_id: providerCode,
            provider_subscription_token: typeof emailToken === 'string' ? emailToken : null,
            provider_plan_id: planCode,
            provider_customer_email: normalizedEmail,
            provider_next_billing_at: typeof subscriptionData.next_payment_date === 'string' ? subscriptionData.next_payment_date : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'order_id' });
          if (credentialError) throw credentialError;
          if (linkedSubscription?.id && typeof subscriptionData.next_payment_date === 'string') {
            const { error: periodError } = await admin.from('billing_subscriptions').update({
              next_billing_at: subscriptionData.next_payment_date,
              current_period_end: subscriptionData.next_payment_date,
            }).eq('id', linkedSubscription.id);
            if (periodError) throw periodError;
          }
        }
      }
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    if (payload.event === 'invoice.update') {
      const transactionReference = typeof data.transaction?.reference === 'string' ? data.transaction.reference : reference;
      const invoicePaid = data.paid === true || data.status === 'success' || data.transaction?.status === 'success';
      if (invoicePaid && transactionReference && subscriptionCode) {
        const invoiceVerifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(transactionReference)}`, {
          headers: { Authorization: `Bearer ${secret}` },
          cache: 'no-store',
        });
        const invoiceVerification = await invoiceVerifyResponse.json();
        const verifiedInvoiceTransaction = invoiceVerification?.data;
        if (!invoiceVerifyResponse.ok || !invoiceVerification?.status || verifiedInvoiceTransaction?.status !== 'success') {
          return NextResponse.json({ error: 'Recurring invoice payment verification failed.' }, { status: 400 });
        }
        const settled = await recordManagedPlanRenewal({
          provider: 'paystack',
          providerSubscriptionId: subscriptionCode,
          reference: transactionReference,
          amount: Number(verifiedInvoiceTransaction.amount) / 100,
          currency: verifiedInvoiceTransaction.currency,
          paidAt: typeof data.paid_at === 'string' ? data.paid_at : new Date().toISOString(),
          nextBillingAt: typeof subscriptionData.next_payment_date === 'string' ? subscriptionData.next_payment_date : null,
        });
        if (!settled) return NextResponse.json({ error: 'Recurring invoice could not be matched to a HostSuite subscription.' }, { status: 409 });
      }
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    if (payload.event === 'invoice.payment_failed') {
      await markManagedPlanRenewalFailed({ provider: 'paystack', providerSubscriptionId: subscriptionCode, reason: data.description ?? data.message ?? 'Paystack could not collect the recurring payment.' });
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    if (payload.event === 'subscription.not_renew' || payload.event === 'subscription.disable') {
      if (subscriptionCode) {
        const { data: credentials, error: credentialError } = await admin.from('billing_subscription_provider_credentials')
          .select('subscription_id')
          .eq('provider', 'paystack')
          .eq('provider_subscription_id', subscriptionCode)
          .maybeSingle();
        if (credentialError) throw credentialError;
        if (credentials?.subscription_id) {
          const { data: subscription, error: lookupError } = await admin.from('billing_subscriptions')
            .select('id,current_period_end')
            .eq('id', credentials.subscription_id)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (subscription) {
            const paidThrough = subscription.current_period_end && new Date(subscription.current_period_end) > new Date();
            const disabled = payload.event === 'subscription.disable';
            const { error } = await admin.from('billing_subscriptions').update({
              auto_renew: false,
              cancel_at_period_end: true,
              status: disabled && !paidThrough ? 'cancelled' : 'active',
              cancelled_at: new Date().toISOString(),
            }).eq('id', subscription.id);
            if (error) throw error;
          }
        }
      }
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    if (payload.event !== 'charge.success' || !reference) {
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    const verificationResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' });
    const verification = await verificationResponse.json();
    const transaction = verification?.data;
    if (!verificationResponse.ok || !verification?.status || transaction?.status !== 'success') return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 });

    const { data: order } = await admin.from('billing_orders').select('id,user_id,total,currency,metadata,status,paid_at,provider').eq('provider', 'paystack').eq('provider_reference', reference).maybeSingle();
    if (order && Number(transaction.amount) !== Math.round(Number(order.total) * 100)) return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 400 });
    if (order && transaction.currency !== order.currency) return NextResponse.json({ error: 'Payment currency mismatch.' }, { status: 400 });

    if (order?.metadata?.source === 'ticket_quote') {
      const { data: settlement, error: settlementError } = await admin.rpc('settle_ticket_quote_payment', { p_order_id: order.id });
      if (settlementError) throw settlementError;
      if (settlement === 'stale_payment' || settlement === 'order_not_payable') {
        await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
        return NextResponse.json({ received: true, reconciliation: 'required' });
      }
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true, ticketQuote: settlement });
    }

    const now = new Date().toISOString();
    if (order) {
      const providerDetails = {
        id: subscriptionCode,
        token: typeof subscriptionData.email_token === 'string' ? subscriptionData.email_token : null,
        customerEmail: typeof subscriptionData.customer?.email === 'string' ? subscriptionData.customer.email.toLowerCase() : (typeof order.metadata?.customer_email === 'string' ? order.metadata.customer_email : null),
        planId: typeof subscriptionData.plan?.plan_code === 'string' ? subscriptionData.plan.plan_code : order.metadata?.provider_plan_id,
        nextBillingAt: typeof subscriptionData.next_payment_date === 'string' ? subscriptionData.next_payment_date : null,
      };
      const { error: orderUpdateError } = await admin.from('billing_orders').update({ status: 'paid', paid_at: now }).eq('id', order.id);
      if (orderUpdateError) throw orderUpdateError;
      const { error: invoiceUpdateError } = await admin.from('billing_invoices').update({ status: 'paid', paid_at: now }).eq('order_id', order.id);
      if (invoiceUpdateError) throw invoiceUpdateError;

      const managedPlan = await activateManagedPlanSubscription({ ...order, paid_at: now }, providerDetails);
      if (!managedPlan) {
        const { error: entitlementError } = await admin.rpc('grant_billing_order_value', { p_order_id: order.id });
        if (entitlementError) throw entitlementError;
        const { error: serviceInstanceError } = await admin.rpc('create_service_instances_for_order', { p_order_id: order.id });
        if (serviceInstanceError) throw serviceInstanceError;
        const { data: instances, error: instancesError } = await admin.from('service_instances').select('id').eq('order_id', order.id).eq('status', 'paid');
        if (instancesError) throw instancesError;
        for (const instance of instances ?? []) await provisionServiceInstance(instance.id);
      }
    } else if (subscriptionCode) {
      const settled = await recordManagedPlanRenewal({
        provider: 'paystack',
        providerSubscriptionId: subscriptionCode,
        reference,
        amount: Number(transaction.amount) / 100,
        currency: transaction.currency,
        paidAt: now,
        nextBillingAt: typeof subscriptionData.next_payment_date === 'string' ? subscriptionData.next_payment_date : null,
      });
      if (!settled) return NextResponse.json({ error: 'Recurring subscription could not be matched to a HostSuite account.' }, { status: 409 });
    } else {
      // Paystack also sends invoice.update with the subscription code for renewal charges.
      // That event is the authoritative fallback when charge.success omits subscription details.
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: now }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    await admin.from('billing_webhook_events').update({ processed: true, processed_at: now }).eq('provider', 'paystack').eq('event_id', eventId);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook processing failed', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
