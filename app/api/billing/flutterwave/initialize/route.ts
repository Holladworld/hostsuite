import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedUser } from '@/lib/supabase-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getCanonicalAppUrl, getCheckoutProviderBlock, validateCheckoutItemConfiguration, verifyDomainAvailability } from '@/lib/billing/checkout-validation';

const bodySchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(20).refine((ids) => new Set(ids).size === ids.length),
  quantities: z.record(z.string(), z.number().int().min(1).max(100)).optional(),
  metadata: z.record(z.string(), z.record(z.unknown())).optional(),
  idempotencyKey: z.string().uuid().optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const authenticated = await getVerifiedUser(request);
    const user = authenticated?.user;
    if (!user?.email) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });
    const secret = process.env.FLW_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Payment provider is not configured yet.' }, { status: 503 });
    const redirectUrl = getCanonicalAppUrl('/portal/billing');

    const admin = createAdminSupabaseClient();
    const { data: products, error } = await admin.from('billing_products')
      .select('id,product_type,billing_mode,currency,active')
      .in('id', parsed.data.productIds).eq('active', true);
    if (error) throw error;
    if (!products || products.length !== parsed.data.productIds.length) return NextResponse.json({ error: 'One or more selected services are unavailable.' }, { status: 400 });
    if (products.some((product) => product.currency !== 'NGN')) return NextResponse.json({ error: 'Flutterwave checkout currently supports NGN products only.' }, { status: 400 });

    const quantities = parsed.data.quantities ?? {};
    const metadataByProduct = parsed.data.metadata ?? {};
    const allowedIds = new Set(products.map((product) => product.id));
    if (Object.keys(quantities).some((id) => !allowedIds.has(id)) || Object.keys(metadataByProduct).some((id) => !allowedIds.has(id))) {
      return NextResponse.json({ error: 'Checkout contains settings for an unselected product.' }, { status: 400 });
    }

    const items = [];
    for (const product of products) {
      const validated = validateCheckoutItemConfiguration(product.product_type, quantities[product.id] ?? 1, metadataByProduct[product.id] ?? {});
      if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
      if (product.product_type === 'domain') {
        const availability = await verifyDomainAvailability(String(validated.metadata.domain));
        if (!availability.ok) return NextResponse.json({ error: availability.error }, { status: 409 });
      }
      const providerBlock = getCheckoutProviderBlock(product.product_type);
      if (providerBlock) return NextResponse.json({ error: providerBlock }, { status: 409 });
      if (product.billing_mode !== 'one_time') return NextResponse.json({ error: 'This billing type is not available through one-time checkout.' }, { status: 400 });
      items.push({ product_id: product.id, quantity: validated.quantity, metadata: validated.metadata });
    }

    const txRef = `HS-FLW-${Date.now()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const { data: created, error: createError } = await admin.rpc('create_billing_checkout_order', {
      p_user_id: user.id,
      p_provider: 'flutterwave',
      p_provider_reference: txRef,
      p_idempotency_key: parsed.data.idempotencyKey ?? crypto.randomUUID(),
      p_items: items,
    });
    if (createError) throw createError;
    const order = Array.isArray(created) ? created[0] : created;
    if (!order?.order_id || !order?.invoice_number || Number(order.total) <= 0) throw new Error('CHECKOUT_ORDER_CREATION_FAILED');
    if (order.reused) {
      const { data: existingSession, error: sessionError } = await admin.from('billing_orders')
        .select('payment_authorization_url').eq('id', order.order_id).eq('user_id', user.id).maybeSingle();
      if (sessionError) throw sessionError;
      if (!existingSession?.payment_authorization_url) return NextResponse.json({ error: 'This checkout is already being prepared. Please wait a moment and try again.' }, { status: 409 });
      return NextResponse.json({ authorizationUrl: existingSession.payment_authorization_url, reference: order.provider_reference, orderId: order.order_id, invoiceNumber: order.invoice_number });
    }

    let response: Response;
    let result: any;
    try {
      response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_ref: order.provider_reference,
          amount: Number(order.total),
          currency: order.currency,
          redirect_url: redirectUrl,
          customer: { email: user.email },
          meta: { order_id: order.order_id, user_id: user.id },
        }),
        cache: 'no-store',
      });
      result = await response.json();
    } catch {
      await admin.from('billing_orders').update({ status: 'failed' }).eq('id', order.order_id).eq('status', 'pending');
      await admin.from('billing_invoices').update({ status: 'void' }).eq('order_id', order.order_id).eq('status', 'open');
      return NextResponse.json({ error: 'Payment provider could not be reached. No payment session was created.' }, { status: 502 });
    }
    if (!response.ok || result.status !== 'success' || !result.data?.link) {
      await admin.from('billing_orders').update({ status: 'failed' }).eq('id', order.order_id).eq('status', 'pending');
      await admin.from('billing_invoices').update({ status: 'void' }).eq('order_id', order.order_id).eq('status', 'open');
      return NextResponse.json({ error: 'Unable to initialize payment.' }, { status: 502 });
    }
    const { error: sessionSaveError } = await admin.from('billing_orders').update({ payment_authorization_url: result.data.link }).eq('id', order.order_id).eq('status', 'pending');
    if (sessionSaveError) console.error('Could not persist payment authorization URL', sessionSaveError);
    return NextResponse.json({ authorizationUrl: result.data.link, reference: order.provider_reference, orderId: order.order_id, invoiceNumber: order.invoice_number });
  } catch (error) {
    console.error('Flutterwave initialization failed', error);
    if (error instanceof Error && error.message.startsWith('APP_BASE_URL')) return NextResponse.json({ error: 'Checkout is temporarily unavailable while the payment return address is configured.' }, { status: 503 });
    return NextResponse.json({ error: 'Unable to start payment.' }, { status: 500 });
  }
}
