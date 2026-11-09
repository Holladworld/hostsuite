import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedUser } from '@/lib/supabase-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getPaymentProvider } from '@/lib/payments/providers';
import type { PaymentProvider, PaymentProviderName } from '@/lib/payments/types';
import {
  getCanonicalAppUrl,
  getCheckoutProviderBlock,
  validateCheckoutItemConfiguration,
  verifyDomainAvailability,
} from '@/lib/billing/checkout-validation';

const checkoutSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(20).refine((ids) => new Set(ids).size === ids.length),
  quantities: z.record(z.string(), z.number().int().min(1).max(100)).optional(),
  metadata: z.record(z.string(), z.record(z.unknown())).optional(),
  idempotencyKey: z.string().uuid().optional(),
}).strict();

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

type InitializeOrderPaymentInput = {
  admin: AdminClient;
  provider: PaymentProvider;
  user: { id: string; email: string };
  orderId: string;
  reference: string;
  amount: number;
  currency: string;
  callbackUrl: string;
  recurringPlanId?: string;
};

/**
 * The single payment-session boundary used by standard purchases and managed plans.
 * Order creation remains policy-specific; provider initialization and session persistence do not.
 */
export async function initializeOrderPaymentSession(input: InitializeOrderPaymentInput): Promise<string> {
  try {
    const payment = await input.provider.initialize({
      email: input.user.email,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      callbackUrl: input.callbackUrl,
      orderId: input.orderId,
      userId: input.user.id,
      recurringPlanId: input.recurringPlanId,
    });
    const { error } = await input.admin.from('billing_orders')
      .update({ payment_authorization_url: payment.authorizationUrl })
      .eq('id', input.orderId)
      .eq('user_id', input.user.id)
      .eq('status', 'pending');
    if (error) throw error;
    return payment.authorizationUrl;
  } catch (error) {
    await input.admin.from('billing_orders').update({ status: 'failed' })
      .eq('id', input.orderId).eq('user_id', input.user.id).eq('status', 'pending');
    await input.admin.from('billing_invoices').update({ status: 'void' })
      .eq('order_id', input.orderId).eq('status', 'open');
    if (error instanceof Error && error.message === 'PAYMENT_PROVIDER_NOT_CONFIGURED') throw error;
    throw new Error('PAYMENT_INITIALIZATION_FAILED', { cause: error });
  }
}

/** Shared authenticated one-time checkout for every supported payment provider. */
export async function initializeStandardCheckout(
  request: Request,
  providerOverride?: PaymentProviderName,
): Promise<NextResponse> {
  try {
    const authenticated = await getVerifiedUser(request);
    const user = authenticated?.user;
    if (!user?.email) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });

    const provider = getPaymentProvider(providerOverride);
    if (!provider.isConfigured()) {
      return NextResponse.json({ error: 'Payment is temporarily unavailable. HostSuite is restoring the payment connection.' }, { status: 503 });
    }

    const callbackUrl = getCanonicalAppUrl('/portal/billing');
    const admin = createAdminSupabaseClient();
    const { data: products, error } = await admin.from('billing_products')
      .select('id,product_type,billing_mode,currency,active')
      .in('id', parsed.data.productIds).eq('active', true);
    if (error) throw error;
    if (!products || products.length !== parsed.data.productIds.length) {
      return NextResponse.json({ error: 'One or more selected services are unavailable.' }, { status: 400 });
    }
    if (products.some((product) => product.currency !== 'NGN')) {
      return NextResponse.json({ error: `${provider.name === 'paystack' ? 'Paystack' : 'Flutterwave'} checkout currently supports NGN products only.` }, { status: 400 });
    }

    const quantities = parsed.data.quantities ?? {};
    const metadataByProduct = parsed.data.metadata ?? {};
    const allowedIds = new Set(products.map((product) => product.id));
    if (Object.keys(quantities).some((id) => !allowedIds.has(id)) || Object.keys(metadataByProduct).some((id) => !allowedIds.has(id))) {
      return NextResponse.json({ error: 'Checkout contains settings for an unselected product.' }, { status: 400 });
    }

    const items: Array<{ product_id: string; quantity: number; metadata: Record<string, unknown> }> = [];
    for (const product of products) {
      const validated = validateCheckoutItemConfiguration(
        product.product_type,
        quantities[product.id] ?? 1,
        metadataByProduct[product.id] ?? {},
      );
      if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

      if (product.product_type === 'domain') {
        const availability = await verifyDomainAvailability(String(validated.metadata.domain));
        if (!availability.ok) return NextResponse.json({ error: availability.error }, { status: 409 });
      }
      const providerBlock = getCheckoutProviderBlock(product.product_type);
      if (providerBlock) return NextResponse.json({ error: providerBlock }, { status: 409 });
      if (product.billing_mode !== 'one_time') {
        return NextResponse.json({ error: 'This billing type is not available through one-time checkout.' }, { status: 400 });
      }
      items.push({ product_id: product.id, quantity: validated.quantity, metadata: validated.metadata });
    }

    const reference = `HS-${provider.name.toUpperCase()}-${Date.now()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const { data: created, error: createError } = await admin.rpc('create_billing_checkout_order', {
      p_user_id: user.id,
      p_provider: provider.name,
      p_provider_reference: reference,
      p_idempotency_key: parsed.data.idempotencyKey ?? crypto.randomUUID(),
      p_items: items,
    });
    if (createError) throw createError;
    const order = Array.isArray(created) ? created[0] : created;
    if (!order?.order_id || !order?.invoice_number || Number(order.total) <= 0) {
      throw new Error('CHECKOUT_ORDER_CREATION_FAILED');
    }

    if (order.reused) {
      const { data: existingSession, error: sessionError } = await admin.from('billing_orders')
        .select('payment_authorization_url').eq('id', order.order_id).eq('user_id', user.id).maybeSingle();
      if (sessionError) throw sessionError;
      if (!existingSession?.payment_authorization_url) {
        return NextResponse.json({ error: 'This checkout is already being prepared. Please wait a moment and try again.' }, { status: 409 });
      }
      return NextResponse.json({
        authorizationUrl: existingSession.payment_authorization_url,
        reference: order.provider_reference,
        orderId: order.order_id,
        invoiceNumber: order.invoice_number,
        provider: provider.name,
      });
    }

    const authorizationUrl = await initializeOrderPaymentSession({
      admin, provider, user: { id: user.id, email: user.email }, orderId: order.order_id, reference: order.provider_reference,
      amount: Number(order.total), currency: order.currency, callbackUrl,
    });
    return NextResponse.json({
      authorizationUrl,
      reference: order.provider_reference,
      orderId: order.order_id,
      invoiceNumber: order.invoice_number,
      provider: provider.name,
    });
  } catch (error) {
    console.error('Unified billing checkout failed', error);
    if (error instanceof Error && error.message.startsWith('APP_BASE_URL')) {
      return NextResponse.json({ error: 'Checkout is temporarily unavailable while the payment return address is configured.' }, { status: 503 });
    }
    if (error instanceof Error && error.message === 'PAYMENT_PROVIDER_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Payment is temporarily unavailable. HostSuite is restoring the payment connection.' }, { status: 503 });
    }
    if (error instanceof Error && error.message === 'PAYMENT_INITIALIZATION_FAILED') {
      return NextResponse.json({ error: 'Unable to initialize payment.' }, { status: 502 });
    }
    return NextResponse.json({ error: 'Unable to start payment.' }, { status: 500 });
  }
}
