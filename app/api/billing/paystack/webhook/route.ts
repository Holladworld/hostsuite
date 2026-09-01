import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

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
  if (!validSignature(rawBody, request.headers.get('x-paystack-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };
    const eventId = `${payload.event ?? 'unknown'}:${payload.data?.reference ?? crypto.randomUUID()}`;
    const admin = createAdminSupabaseClient();

    const { data: existing } = await admin
      .from('billing_webhook_events')
      .select('id,processed')
      .eq('provider', 'paystack')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing?.processed) return NextResponse.json({ received: true });

    await admin.from('billing_webhook_events').upsert({
      provider: 'paystack',
      event_id: eventId,
      event_type: payload.event ?? 'unknown',
      signature_valid: true,
      payload,
    }, { onConflict: 'provider,event_id' });

    if (payload.event !== 'charge.success' || !payload.data?.reference) {
      await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);
      return NextResponse.json({ received: true });
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(payload.data.reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });
    const verification = await verifyResponse.json();
    const transaction = verification?.data;

    if (!verifyResponse.ok || !verification?.status || transaction?.status !== 'success') {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 });
    }

    const { data: order } = await admin
      .from('billing_orders')
      .select('id,total,currency,status')
      .eq('provider', 'paystack')
      .eq('provider_reference', payload.data.reference)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const expectedKobo = Math.round(Number(order.total) * 100);
    if (Number(transaction.amount) !== expectedKobo || transaction.currency !== order.currency) {
      return NextResponse.json({ error: 'Payment amount or currency mismatch.' }, { status: 400 });
    }

    await admin.from('billing_orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id);
    await admin.from('billing_invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('order_id', order.id);
    await admin.from('billing_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('provider', 'paystack').eq('event_id', eventId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook processing failed', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
