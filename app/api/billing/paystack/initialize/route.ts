import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

const bodySchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(20),
  quantities: z.record(z.string(), z.number().positive()).optional(),
  callbackUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { data: products, error: productError } = await admin
      .from('billing_products')
      .select('id,name,description,product_type,billing_mode,currency,price,active')
      .in('id', parsed.data.productIds)
      .eq('active', true);

    if (productError) throw productError;
    if (!products || products.length !== parsed.data.productIds.length) {
      return NextResponse.json({ error: 'One or more selected services are unavailable.' }, { status: 400 });
    }

    const currencies = new Set(products.map((product) => product.currency));
    if (currencies.size !== 1 || !currencies.has('NGN')) {
      return NextResponse.json({ error: 'Paystack checkout currently supports one NGN order at a time.' }, { status: 400 });
    }

    const quantities = parsed.data.quantities ?? {};
    const items = products.map((product) => {
      const quantity = quantities[product.id] ?? 1;
      const total = Number(product.price) * quantity;
      return {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: Number(product.price),
        total,
      };
    });

    const total = items.reduce((sum, item) => sum + item.total, 0);
    const idempotencyKey = crypto.randomUUID();
    const reference = `HS-${Date.now()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;

    const { data: order, error: orderError } = await admin
      .from('billing_orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        currency: 'NGN',
        subtotal: total,
        total,
        provider: 'paystack',
        provider_reference: reference,
        idempotency_key: idempotencyKey,
        metadata: { source: 'portal' },
      })
      .select('id,total,currency,provider_reference')
      .single();

    if (orderError) throw orderError;

    const { error: itemError } = await admin.from('billing_order_items').insert(
      items.map((item) => ({ ...item, order_id: order.id }))
    );
    if (itemError) throw itemError;

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Payment provider is not configured yet.' }, { status: 503 });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(total * 100),
        currency: 'NGN',
        reference,
        callback_url: parsed.data.callbackUrl,
        metadata: { order_id: order.id, user_id: user.id },
      }),
      cache: 'no-store',
    });

    const result = await response.json();
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      await admin.from('billing_orders').update({ status: 'failed' }).eq('id', order.id);
      return NextResponse.json({ error: 'Unable to initialize payment.' }, { status: 502 });
    }

    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference, orderId: order.id });
  } catch (error) {
    console.error('Paystack initialization failed', error);
    return NextResponse.json({ error: 'Unable to start payment.' }, { status: 500 });
  }
}
