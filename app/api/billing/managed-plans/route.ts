import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedUser } from '@/lib/supabase-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { createRecurringPaymentPlan, getPaymentProvider } from '@/lib/payments/providers';
import { getManagedPlan, type ManagedPlanInterval, type ManagedPlanKey } from '@/lib/billing/managed-plans';
import { getCanonicalAppUrl } from '@/lib/billing/checkout-validation';

const planSchema = z.object({
  planKey: z.enum(['starter_ops', 'managed_growth']),
  interval: z.enum(['monthly', 'yearly']),
});

const checkoutSchema = planSchema.extend({
  autoRenew: z.boolean(),
  termsAccepted: z.literal(true),
  recurringConsent: z.boolean(),
  idempotencyKey: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const parsed = planSchema.safeParse({
    planKey: new URL(request.url).searchParams.get('plan'),
    interval: new URL(request.url).searchParams.get('interval'),
  });
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid managed-care plan and billing period.' }, { status: 400 });
  try {
    const plan = await getManagedPlan(parsed.data.planKey as ManagedPlanKey, parsed.data.interval as ManagedPlanInterval);
    if (!plan) return NextResponse.json({ error: 'This plan is not available for online checkout yet.' }, { status: 404 });
    return NextResponse.json({
      id: plan.id,
      name: plan.name,
      interval: plan.interval,
      amount: plan.amount,
      currency: plan.currency,
      provider: getPaymentProvider().name,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Managed plan lookup failed', error);
    return NextResponse.json({ error: 'We could not load this plan right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await getVerifiedUser(request);
    const user = authenticated?.user;
    if (!user?.email) return NextResponse.json({ error: 'Please sign in before checkout.' }, { status: 401 });

    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Confirm the plan terms and billing choice before continuing.' }, { status: 400 });
    if (parsed.data.autoRenew && !parsed.data.recurringConsent) {
      return NextResponse.json({ error: 'Please confirm authorization for recurring payments, or turn automatic renewal off.' }, { status: 400 });
    }

    const plan = await getManagedPlan(parsed.data.planKey as ManagedPlanKey, parsed.data.interval as ManagedPlanInterval);
    if (!plan) return NextResponse.json({ error: 'This plan is not available for online checkout yet.' }, { status: 404 });
    const provider = getPaymentProvider();
    if (!provider.isConfigured()) return NextResponse.json({ error: 'Online payment is temporarily unavailable. Please try again later.' }, { status: 503 });

    const callbackUrl = getCanonicalAppUrl('/portal/managed-plan/complete');
    const admin = createAdminSupabaseClient();
    let recurringPlanId: string | null = null;
    if (parsed.data.autoRenew) {
      const planVersion = `${plan.currency.toUpperCase().replace(/[^A-Z0-9]/g, '')}_${parsed.data.interval}_${Math.round(plan.amount * 100)}`;
      const metadataKey = `${provider.name}_plan_${planVersion}`;
      const existingPlanId = plan.metadata[metadataKey];
      recurringPlanId = typeof existingPlanId === 'string' || typeof existingPlanId === 'number'
        ? String(existingPlanId)
        : null;
      if (!recurringPlanId) {
        recurringPlanId = await createRecurringPaymentPlan({
          provider: provider.name,
          name: plan.name,
          amount: plan.amount,
          currency: plan.currency,
          interval: parsed.data.interval,
        });
        const { error: metadataError } = await admin.from('billing_products')
          .update({ metadata: { ...plan.metadata, [metadataKey]: recurringPlanId } })
          .eq('id', plan.id);
        if (metadataError) throw metadataError;
      }
    }

    const reference = `HS-${provider.name.toUpperCase()}-${Date.now()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const consentAt = parsed.data.autoRenew ? new Date().toISOString() : null;
    const metadata = {
      source: 'managed_plan',
      plan_key: parsed.data.planKey,
      interval: parsed.data.interval,
      plan_name: plan.name,
      product_id: plan.id,
      auto_renew: parsed.data.autoRenew,
      service_terms_accepted_at: new Date().toISOString(),
      service_terms_version: 'hostsuite-managed-care-terms-2026-11',
      renewal_consent_at: consentAt,
      renewal_terms_version: 'managed-care-recurring-v1',
      provider: provider.name,
      provider_plan_id: recurringPlanId,
      customer_email: user.email.toLowerCase(),
      term_amount: plan.amount,
      currency: plan.currency,
    };

    const { data: createdOrder, error: orderError } = await admin.rpc('create_managed_plan_checkout_order', {
      p_user_id: user.id,
      p_provider: provider.name,
      p_provider_reference: reference,
      p_idempotency_key: parsed.data.idempotencyKey ?? crypto.randomUUID(),
      p_product_id: plan.id,
      p_amount: plan.amount,
      p_currency: plan.currency,
      p_metadata: metadata,
    });
    if (orderError) throw orderError;
    const order = Array.isArray(createdOrder) ? createdOrder[0] : createdOrder;
    if (!order?.order_id || !order?.invoice_number) throw new Error('MANAGED_PLAN_ORDER_CREATION_FAILED');
    const invoiceNumber = order.invoice_number;
    if (order.reused) {
      const { data: existingSession, error: sessionError } = await admin.from('billing_orders')
        .select('payment_authorization_url').eq('id', order.order_id).eq('user_id', user.id).maybeSingle();
      if (sessionError) throw sessionError;
      if (!existingSession?.payment_authorization_url) return NextResponse.json({ error: 'This checkout is already being prepared. Please wait a moment and try again.' }, { status: 409 });
      return NextResponse.json({ authorizationUrl: existingSession.payment_authorization_url, reference: order.provider_reference, orderId: order.order_id, invoiceNumber });
    }

    try {
      const payment = await provider.initialize({
        email: user.email,
        amount: plan.amount,
        currency: plan.currency,
        reference,
        callbackUrl,
        orderId: order.order_id,
        userId: user.id,
        recurringPlanId: recurringPlanId ?? undefined,
      });
      const { error: sessionSaveError } = await admin.from('billing_orders').update({ payment_authorization_url: payment.authorizationUrl }).eq('id', order.order_id).eq('status', 'pending');
      if (sessionSaveError) console.error('Could not persist managed-plan payment authorization URL', sessionSaveError);
      return NextResponse.json({ authorizationUrl: payment.authorizationUrl, reference: order.provider_reference, orderId: order.order_id, invoiceNumber });
    } catch (providerError) {
      await admin.from('billing_orders').update({ status: 'failed' }).eq('id', order.order_id).eq('status', 'pending');
      await admin.from('billing_invoices').update({ status: 'void' }).eq('order_id', order.order_id).eq('status', 'open');
      if (providerError instanceof Error && providerError.message === 'PAYMENT_PROVIDER_NOT_CONFIGURED') {
        return NextResponse.json({ error: 'Online payment is temporarily unavailable. Please try again later.' }, { status: 503 });
      }
      if (providerError instanceof Error && providerError.message === 'RECURRING_PLAN_CREATION_FAILED') {
        return NextResponse.json({ error: 'We could not prepare automatic renewal with the payment provider. No payment has been taken.' }, { status: 502 });
      }
      return NextResponse.json({ error: 'We could not start your payment. Please try again.' }, { status: 502 });
    }
  } catch (error) {
    console.error('Managed plan checkout failed', error);
    if (error instanceof Error && error.message.startsWith('APP_BASE_URL')) return NextResponse.json({ error: 'Checkout is temporarily unavailable while the payment return address is configured.' }, { status: 503 });
    return NextResponse.json({ error: 'We could not start checkout. Please try again.' }, { status: 500 });
  }
}
