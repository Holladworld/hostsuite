import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedUser } from '@/lib/supabase-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getPaymentProvider } from '@/lib/payments/providers';
import { getManagedPlan, type ManagedPlanInterval, type ManagedPlanKey } from '@/lib/billing/managed-plans';

const planSchema = z.object({
  planKey: z.enum(['starter_ops', 'managed_growth']),
  interval: z.enum(['monthly', 'yearly']),
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
    return NextResponse.json(plan, { headers: { 'Cache-Control': 'no-store' } });
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

    const parsed = planSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Choose a valid managed-care plan and billing period.' }, { status: 400 });

    const plan = await getManagedPlan(parsed.data.planKey as ManagedPlanKey, parsed.data.interval as ManagedPlanInterval);
    if (!plan) return NextResponse.json({ error: 'This plan is not available for online checkout yet.' }, { status: 404 });
    const provider = getPaymentProvider();
    if (!provider.isConfigured()) return NextResponse.json({ error: 'Online payment is temporarily unavailable. Please try again later.' }, { status: 503 });

    const admin = createAdminSupabaseClient();
    const reference = `HS-${provider.name.toUpperCase()}-${Date.now()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const invoiceNumber = `HS-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
    const metadata = {
      source: 'managed_plan',
      plan_key: parsed.data.planKey,
      interval: parsed.data.interval,
      plan_name: plan.name,
      product_id: plan.id,
      auto_renew: false,
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
      });
      return NextResponse.json({ authorizationUrl: payment.authorizationUrl, reference, orderId: order.id, invoiceNumber });
    } catch (providerError) {
      await admin.from('billing_orders').update({ status: 'failed' }).eq('id', order.id);
      if (providerError instanceof Error && providerError.message === 'PAYMENT_PROVIDER_NOT_CONFIGURED') {
        return NextResponse.json({ error: 'Online payment is temporarily unavailable. Please try again later.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'We could not start your payment. Please try again.' }, { status: 502 });
    }
  } catch (error) {
    console.error('Managed plan checkout failed', error);
    return NextResponse.json({ error: 'We could not start checkout. Please try again.' }, { status: 500 });
  }
}
