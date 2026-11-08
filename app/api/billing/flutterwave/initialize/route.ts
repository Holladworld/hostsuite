import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

const bodySchema = z.object({ productIds: z.array(z.string().uuid()).min(1).max(20), quantities: z.record(z.string(), z.number().positive()).optional(), redirectUrl: z.string().url().optional() });

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { data: products, error } = await admin.from('billing_products').select('id,name,price,currency,active').in('id', parsed.data.productIds).eq('active', true);
    if (error) throw error;
    if (!products || products.length !== parsed.data.productIds.length) return NextResponse.json({ error: 'One or more selected services are unavailable.' }, { status: 400 });

    const currencies = new Set(products.map((p) => p.currency));
    if (currencies.size !== 1 || !currencies.has('NGN')) return NextResponse.json({ error: 'Flutterwave checkout currently supports one NGN order at a time.' }, { status: 400 });

    const quantities = parsed.data.quantities ?? {};
    const items = products.map((p) => { const quantity = quantities[p.id] ?? 1; const unitPrice = Number(p.price); return { product_id: p.id, product_name: p.name, quantity, unit_price: unitPrice, total: unitPrice * quantity }; });
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const txRef = `HS-FLW-${Date.now()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const idempotencyKey = crypto.randomUUID();
    const invoiceNumber = `HS-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;

    const { data: order, error: orderError } = await admin.from('billing_orders').insert({ user_id: user.id, status: 'pending', currency: 'NGN', subtotal: total, total, provider: 'flutterwave', provider_reference: txRef, idempotency_key: idempotencyKey, metadata: { source: 'portal' } }).select('id').single();
    if (orderError) throw orderError;
    const { error: itemError } = await admin.from('billing_order_items').insert(items.map((item) => ({ ...item, order_id: order.id })));
    if (itemError) throw itemError;
    const { error: invoiceError } = await admin.from('billing_invoices').insert({ user_id: user.id, order_id: order.id, invoice_number: invoiceNumber, status: 'open', currency: 'NGN', subtotal: total, total });
    if (invoiceError) throw invoiceError;

    const secret = process.env.FLW_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Payment provider is not configured yet.' }, { status: 503 });

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_ref: txRef, amount: total, currency: 'NGN', redirect_url: parsed.data.redirectUrl, customer: { email: user.email }, meta: { order_id: order.id, user_id: user.id } }), cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'success' || !result.data?.link) {
      await admin.from('billing_orders').update({ status: 'failed' }).eq('id', order.id);
      return NextResponse.json({ error: 'Unable to initialize payment.' }, { status: 502 });
    }
    return NextResponse.json({ authorizationUrl: result.data.link, reference: txRef, orderId: order.id, invoiceNumber });
  } catch (error) {
    console.error('Flutterwave initialization failed', error);
    return NextResponse.json({ error: 'Unable to start payment.' }, { status: 500 });
  }
}
