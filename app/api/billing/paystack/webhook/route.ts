import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { provisionServiceInstance } from '@/lib/services/provisioning';
import { activateManagedPlanSubscription } from '@/lib/billing/managed-plan-settlement';

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
    const payload = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };
    const reference = payload.data?.reference;
    const eventId = `${payload.event ?? 'unknown'}:${reference ?? crypto.randomUUID()}`;
    const admin = createAdminSupabaseClient();

    const { data: existing } = await admin.from('billing_webhook_events').select('processed').eq('provider', 'paystack').eq('event_id', eventId).maybeSingle();
    if (existing?.processed) return NextResponse.json({ received: true });

    await admin.from('billing_webhook_events').upsert({ provider: 'paystack', event_id: eventId, event_type: payload.event ?? 'unknown', signature_valid: true, payload }, { onConflict: 'provider,event_id' });
    if (payload.event !== 'charge.success' || !reference) {
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    const verificationResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' });
    const verification = await verificationResponse.json();
    const transaction = verification?.data;
    if (!verificationResponse.ok || !verification?.status || transaction?.status !== 'success') return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 });

    const { data: order } = await admin.from('billing_orders').select('id,user_id,total,currency,metadata,status,paid_at').eq('provider', 'paystack').eq('provider_reference', reference).maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (Number(transaction.amount) !== Math.round(Number(order.total) * 100) || transaction.currency !== order.currency) return NextResponse.json({ error: 'Payment amount or currency mismatch.' }, { status: 400 });

    if (order.metadata?.source === 'ticket_quote') {
      const { data: settlement, error: settlementError } = await admin.rpc('settle_ticket_quote_payment', { p_order_id: order.id });
      if (settlementError) throw settlementError;
      if (settlement === 'stale_payment') {
        await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
        return NextResponse.json({ received: true, reconciliation: 'required' });
      }
      if (settlement === 'order_not_payable') {
        await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
        return NextResponse.json({ received: true, reconciliation: 'required' });
      }
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true, ticketQuote: settlement });
    }

    const now = new Date().toISOString();
    const { error: orderUpdateError } = await admin.from('billing_orders').update({ status: 'paid', paid_at: now }).eq('id', order.id);
    if (orderUpdateError) throw orderUpdateError;

    const { error: invoiceUpdateError } = await admin.from('billing_invoices').update({ status: 'paid', paid_at: now }).eq('order_id', order.id);
    if (invoiceUpdateError) throw invoiceUpdateError;

    const managedPlan = await activateManagedPlanSubscription({
      id: order.id,
      user_id: order.user_id,
      paid_at: now,
      metadata: order.metadata,
    });

    if (!managedPlan) {
      const { error: entitlementError } = await admin.rpc('grant_billing_order_value', { p_order_id: order.id });
      if (entitlementError) throw entitlementError;
      const { error: serviceInstanceError } = await admin.rpc('create_service_instances_for_order', { p_order_id: order.id });
      if (serviceInstanceError) throw serviceInstanceError;

      // Provider provisioning is attempted only for purchased resources that
      // have a supported provider lifecycle. Managed-care plans are customer
      // subscriptions, not provider-provisioned hosting resources.
      const { data: instances, error: instancesError } = await admin
        .from('service_instances')
        .select('id')
        .eq('order_id', order.id)
        .eq('status', 'paid');
      if (instancesError) throw instancesError;
      for (const instance of instances ?? []) await provisionServiceInstance(instance.id);
    }

    await admin.from('billing_webhook_events').update({ processed: true, processed_at: now }).eq('provider', 'paystack').eq('event_id', eventId);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook processing failed', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
