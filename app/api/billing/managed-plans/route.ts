import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedUser } from '@/lib/supabase-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { createRecurringPaymentPlan, getPaymentProvider } from '@/lib/payments/providers';
import { getManagedPlan, type ManagedPlanInterval, type ManagedPlanKey } from '@/lib/billing/managed-plans';

const planSchema = z.object({
  planKey: z.enum(['starter_ops', 'managed_growth']),
  interval: z.enum(['monthly', 'yearly']),
});

const checkoutSchema = planSchema.extend({
  autoRenew: z.boolean(),
  termsAccepted: z.literal(true),
  recurringConsent: z.boolean(),
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
    const invoiceNumber = `HS-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
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

    const { data: order, error: orderError } = await admin.from('billing_orders').insert({
      user_id: user.id,
      status: 'pending',
      currency: plan.currency,
      subtotal: plan.amount,
      total: plan.amount,
      provider: provider.name,
      provider_reference: reference,
      idempotency_key: crypto.randomUUID(),
      metadata,
    }).select('id').single();
    if (orderError) throw orderError;

    const { error: itemError } = await admin.from('billing_order_items').insert({
      order_id: order.id,
      product_id: plan.id,
      product_name: plan.name,
      quantity: 1,
      unit_price: plan.amount,
      total: plan.amount,
      metadata,
    });
    if (itemError) throw itemError;

    const { error: invoiceError } = await admin.from('billing_invoices').insert({
      user_id: user.id,
      order_id: order.id,
      invoice_number: invoiceNumber,
      status: 'open',
      currency: plan.currency,
      subtotal: plan.amount,
      total: plan.amount,
    });
    if (invoiceError) throw invoiceError;

    const callbackUrl = new URL('/portal/managed-plan/complete', request.url).toString();
    try {
      const payment = await provider.initialize({
        email: user.email,
        amount: plan.amount,
        currency: plan.currency,
        reference,
        callbackUrl,
        orderId: order.id,
        userId: user.id,
        recurringPlanId: recurringPlanId ?? undefined,
      });
      return NextResponse.json({ authorizationUrl: payment.authorizationUrl, reference, orderId: order.id, invoiceNumber });
    } catch (providerError) {
      await admin.from('billing_orders').update({ status: 'failed' }).eq('id', order.id);
      await admin.from('billing_invoices').update({ status: 'void' }).eq('order_id', order.id);
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
    return NextResponse.json({ error: 'We could not start checkout. Please try again.' }, { status: 500 });
  }
}
