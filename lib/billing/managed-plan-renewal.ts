import crypto from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

type ProviderName = 'paystack' | 'flutterwave';

function addPeriod(start: Date, interval: 'monthly' | 'yearly') {
  const next = new Date(start);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  if (interval === 'monthly') next.setUTCMonth(next.getUTCMonth() + 1);
  else next.setUTCFullYear(next.getUTCFullYear() + 1);
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

export async function recordManagedPlanRenewal(input: {
  provider: ProviderName;
  providerSubscriptionId: string;
  reference: string;
  amount: number;
  currency: string;
  paidAt?: string;
  nextBillingAt?: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const { data: credentials, error: credentialsError } = await admin.from('billing_subscription_provider_credentials')
    .select('subscription_id')
    .eq('provider', input.provider)
    .eq('provider_subscription_id', input.providerSubscriptionId)
    .maybeSingle();
  if (credentialsError) throw credentialsError;
  if (!credentials?.subscription_id) return false;

  const { data: subscription, error: subscriptionError } = await admin.from('billing_subscriptions')
    .select('id,user_id,product_id,service_name,amount,currency,interval,status,auto_renew,current_period_end')
    .eq('id', credentials.subscription_id)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;
  if (!subscription) return false;
  if (Number(subscription.amount) !== Number(input.amount) || subscription.currency !== input.currency) {
    throw new Error('Recurring renewal amount or currency does not match the active subscription.');
  }

  const paidAt = input.paidAt ?? new Date().toISOString();
  const idempotencyKey = `managed-renewal:${input.provider}:${input.reference}`;
  let { data: order, error: orderError } = await admin.from('billing_orders')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (orderError) throw orderError;

  if (!order) {
    const inserted = await admin.from('billing_orders').insert({
      user_id: subscription.user_id,
      status: 'paid',
      currency: input.currency,
      subtotal: input.amount,
      total: input.amount,
      provider: input.provider,
      provider_reference: input.reference,
      idempotency_key: idempotencyKey,
      paid_at: paidAt,
      metadata: {
        source: 'managed_plan_renewal',
        subscription_id: subscription.id,
        provider_subscription_id: input.providerSubscriptionId,
      },
    }).select('id').single();
    if (inserted.error) {
      if (inserted.error.code !== '23505') throw inserted.error;
      const retry = await admin.from('billing_orders').select('id').eq('idempotency_key', idempotencyKey).single();
      if (retry.error) throw retry.error;
      order = retry.data;
    } else order = inserted.data;
  }

  const orderId = order.id;
  const [{ data: existingItem, error: itemLookupError }, { data: existingInvoice, error: invoiceLookupError }] = await Promise.all([
    admin.from('billing_order_items').select('id').eq('order_id', orderId).maybeSingle(),
    admin.from('billing_invoices').select('id').eq('order_id', orderId).maybeSingle(),
  ]);
  if (itemLookupError) throw itemLookupError;
  if (invoiceLookupError) throw invoiceLookupError;

  if (!existingItem) {
    const { error } = await admin.from('billing_order_items').insert({
      order_id: orderId,
      product_id: subscription.product_id,
      product_name: subscription.service_name,
      quantity: 1,
      unit_price: input.amount,
      total: input.amount,
      metadata: { source: 'managed_plan_renewal', subscription_id: subscription.id },
    });
    if (error) throw error;
  }
  if (!existingInvoice) {
    const invoiceNumber = `HS-${new Date(paidAt).getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
    const { error } = await admin.from('billing_invoices').insert({
      user_id: subscription.user_id,
      order_id: orderId,
      invoice_number: invoiceNumber,
      status: 'paid',
      currency: input.currency,
      subtotal: input.amount,
      total: input.amount,
      paid_at: paidAt,
    });
    if (error) throw error;
  }

  const periodEnd = input.nextBillingAt
    ? new Date(input.nextBillingAt)
    : addPeriod(new Date(paidAt), subscription.interval as 'monthly' | 'yearly');
  const { error: updateError } = await admin.from('billing_subscriptions').update({
    status: 'active',
    amount: input.amount,
    currency: input.currency,
    current_period_start: paidAt,
    current_period_end: periodEnd.toISOString(),
    next_billing_at: periodEnd.toISOString(),
    last_payment_at: paidAt,
    failed_payment_count: 0,
    last_payment_error: null,
  }).eq('id', subscription.id);
  if (updateError) throw updateError;
  return true;
}

export async function markManagedPlanRenewalFailed(input: {
  provider: ProviderName;
  providerSubscriptionId?: string | null;
  customerEmail?: string | null;
  amount?: number | null;
  reason?: string | null;
}) {
  const admin = createAdminSupabaseClient();
  let query = admin.from('billing_subscription_provider_credentials')
    .select('subscription_id')
    .eq('provider', input.provider);
  if (input.providerSubscriptionId) query = query.eq('provider_subscription_id', input.providerSubscriptionId);
  else if (input.customerEmail) query = query.eq('provider_customer_email', input.customerEmail.toLowerCase());
  else return false;
  const { data: credentials, error } = await query.limit(2);
  if (error) throw error;
  if (!credentials || credentials.length !== 1 || !credentials[0].subscription_id) return false;

  const { data: subscription, error: subscriptionError } = await admin.from('billing_subscriptions')
    .select('id,amount,failed_payment_count,auto_renew')
    .eq('id', credentials[0].subscription_id)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;
  if (!subscription || !subscription.auto_renew) return false;
  if (typeof input.amount === 'number' && Number(subscription.amount) !== Number(input.amount)) return false;

  const { error: updateError } = await admin.from('billing_subscriptions').update({
    status: 'past_due',
    failed_payment_count: Number(subscription.failed_payment_count ?? 0) + 1,
    last_payment_error: (input.reason ?? 'The payment provider reported a failed renewal.').slice(0, 500),
  }).eq('id', subscription.id);
  if (updateError) throw updateError;
  return true;
}
