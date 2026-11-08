import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { provisionServiceInstance } from '@/lib/services/provisioning';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secretHash = process.env.FLW_SECRET_HASH;
  if (!secretHash) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });
  const signature = request.headers.get('flutterwave-signature') ?? request.headers.get('verif-hash');
  if (!signature || signature !== secretHash) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });

  try {
    const payload = await request.json() as { id?: string; type?: string; event?: string; data?: { id?: string | number; tx_ref?: string } };
    const reference = payload.data?.tx_ref;
    const eventId = String(payload.id ?? payload.data?.id ?? reference ?? crypto.randomUUID());
    const admin = createAdminSupabaseClient();
    const { data: existing } = await admin.from('billing_webhook_events').select('processed').eq('provider', 'flutterwave').eq('event_id', eventId).maybeSingle();
    if (existing?.processed) return NextResponse.json({ received: true });

    await admin.from('billing_webhook_events').upsert({ provider: 'flutterwave', event_id: eventId, event_type: payload.type ?? payload.event ?? 'unknown', signature_valid: true, payload }, { onConflict: 'provider,event_id' });
    if (!reference || payload.data?.id == null) return NextResponse.json({ received: true });

    const secret = process.env.FLW_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });
    const verify = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(payload.data.id))}/verify`, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' });
    const result = await verify.json();
    const transaction = result?.data;
    const { data: order } = await admin.from('billing_orders').select('id,total,currency').eq('provider', 'flutterwave').eq('provider_reference', reference).maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const valid = verify.ok && result?.status === 'success' && transaction?.status === 'successful' && transaction?.tx_ref === reference && Number(transaction?.amount) === Number(order.total) && transaction?.currency === order.currency;
    if (!valid) return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 });

    const now = new Date().toISOString();
    const { error: orderError } = await admin.from('billing_orders').update({ status: 'paid', paid_at: now }).eq('id', order.id);
    if (orderError) throw orderError;
    const { error: invoiceError } = await admin.from('billing_invoices').update({ status: 'paid', paid_at: now }).eq('order_id', order.id);
    if (invoiceError) throw invoiceError;
    const { error: entitlementError } = await admin.rpc('grant_billing_order_value', { p_order_id: order.id });
    if (entitlementError) throw entitlementError;
    const { error: serviceInstanceError } = await admin.rpc('create_service_instances_for_order', { p_order_id: order.id });
    if (serviceInstanceError) throw serviceInstanceError;

    const { data: instances, error: instancesError } = await admin.from('service_instances').select('id').eq('order_id', order.id).eq('status', 'paid');
    if (instancesError) throw instancesError;
    for (const instance of instances ?? []) await provisionServiceInstance(instance.id);

    await admin.from('billing_webhook_events').update({ processed: true, processed_at: now }).eq('provider', 'flutterwave').eq('event_id', eventId);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Flutterwave webhook processing failed', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
