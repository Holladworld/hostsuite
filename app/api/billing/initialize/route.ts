import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getPaymentProvider } from '@/lib/payments/providers';

const bodySchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(20),
  quantities: z.record(z.string(), z.number().positive()).optional(),
  metadata: z.record(z.string(), z.record(z.unknown())).optional(),
  callbackUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });

    const provider = getPaymentProvider();
    if (!provider.isConfigured()) return NextResponse.json({ error: 'Payment is temporarily unavailable. HostSuite is restoring the payment connection.' }, { status: 503 });

    const admin = createAdminSupabaseClient();
    const { data: products, error } = await admin.from('billing_products').select('id,name,product_type,currency,price,active').in('id', parsed.data.productIds).eq('active', true);
    if (error) throw error;
    if (!products || products.length !== parsed.data.productIds.length) return NextResponse.json({ error: 'One or more selected services are unavailable.' }, { status: 400 });
    const currencies = new Set(products.map((p) => p.currency));
    if (currencies.size !== 1 || !currencies.has('NGN')) return NextResponse.json({ error: 'Checkout currently supports one NGN order at a time.' }, { status: 400 });

    const quantities = parsed.data.quantities ?? {};
    const metadataByProduct = parsed.data.metadata ?? {};
    const items = products.map((p) => { const quantity = quantities[p.id] ?? 1; const unitPrice = Number(p.price); return { product_id: p.id, product_name: p.name, quantity, unit_price: unitPrice, total: unitPrice * quantity, metadata: metadataByProduct[p.id] ?? {} }; });
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const reference = `HS-${provider.name.toUpperCase()}-${Date.now()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const invoiceNumber = `HS-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;

    const { data: order, error: orderError } = await admin.from('billing_orders').insert({ user_id: user.id, status: 'pending', currency: 'NGN', subtotal: total, total, provider: provider.name, provider_reference: reference, idempotency_key: crypto.randomUUID(), metadata: { source: 'portal', services: products.map((p) => p.product_type) } }).select('id').single();
    if (orderError) throw orderError;
    const { error: itemError } = await admin.from('billing_order_items').insert(items.map((item) => ({ ...item, order_id: order.id })));
    if (itemError) throw itemError;
    const { error: invoiceError } = await admin.from('billing_invoices').insert({ user_id: user.id, order_id: order.id, invoice_number: invoiceNumber, status: 'open', currency: 'NGN', subtotal: total, total });
    if (invoiceError) throw invoiceError;

    try {
      const payment = await provider.initialize({ email: user.email, amount: total, currency: 'NGN', reference, callbackUrl: parsed.data.callbackUrl, orderId: order.id, userId: user.id });
      return NextResponse.json({ authorizationUrl: payment.authorizationUrl, reference, orderId: order.id, invoiceNumber, provider: provider.name });
    } catch (providerError) {
      await admin.from('billing_orders').update({ status: 'failed' }).eq('id', order.id);
      if (providerError instanceof Error && providerError.message === 'PAYMENT_PROVIDER_NOT_CONFIGURED') return NextResponse.json({ error: 'Payment is temporarily unavailable. HostSuite is restoring the payment connection.' }, { status: 503 });
      return NextResponse.json({ error: 'Unable to initialize payment.' }, { status: 502 });
    }
  } catch (error) {
    console.error('Billing initialization failed', error);
    return NextResponse.json({ error: 'Unable to start payment.' }, { status: 500 });
  }
}
