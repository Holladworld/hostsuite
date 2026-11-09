import { createAdminSupabaseClient } from '@/lib/supabase-admin';

type PaidManagedPlanOrder = {
  id: string;
  user_id: string;
  paid_at?: string | null;
  provider?: 'paystack' | 'flutterwave' | null;
  metadata: Record<string, unknown> | null;
};

type ProviderSubscriptionDetails = {
  id?: string | number | null;
  token?: string | null;
  customerEmail?: string | null;
  planId?: string | number | null;
};

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

/** Activates the paid managed-care period after a provider-verified initial payment. */
export async function activateManagedPlanSubscription(
  order: PaidManagedPlanOrder,
  providerDetails: ProviderSubscriptionDetails = {},
) {
  if (order.metadata?.source !== 'managed_plan') return false;

  const productId = typeof order.metadata.product_id === 'string' ? order.metadata.product_id : null;
  const planName = typeof order.metadata.plan_name === 'string' ? order.metadata.plan_name : null;
  const interval = order.metadata.interval === 'yearly' ? 'yearly' : order.metadata.interval === 'monthly' ? 'monthly' : null;
  if (!productId || !planName || !interval) throw new Error('Managed plan order metadata is incomplete.');

  const startsAt = order.paid_at ? new Date(order.paid_at) : new Date();
  const endsAt = addPeriod(startsAt, interval);
  const metadata = order.metadata;
  const autoRenew = metadata.auto_renew === true;
  const provider = order.provider ?? (metadata.provider === 'paystack' || metadata.provider === 'flutterwave' ? metadata.provider : null);
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('billing_subscriptions').upsert({
    user_id: order.user_id,
    product_id: productId,
    source_order_id: order.id,
    service_name: planName,
    amount: Number(metadata.term_amount),
    currency: typeof metadata.currency === 'string' ? metadata.currency : 'NGN',
    interval,
    status: 'active',
    next_billing_at: endsAt.toISOString(),
    current_period_start: startsAt.toISOString(),
    current_period_end: endsAt.toISOString(),
    auto_renew: autoRenew,
    provider: autoRenew ? provider : null,
    provider_plan_id: autoRenew && metadata.provider_plan_id != null ? String(metadata.provider_plan_id) : null,
    provider_subscription_id: autoRenew && providerDetails.id != null ? String(providerDetails.id) : (autoRenew && typeof metadata.provider_subscription_id === 'string' ? metadata.provider_subscription_id : null),
    provider_subscription_token: autoRenew && providerDetails.token ? providerDetails.token : (autoRenew && typeof metadata.provider_subscription_token === 'string' ? metadata.provider_subscription_token : null),
    provider_customer_email: autoRenew ? (providerDetails.customerEmail ?? (typeof metadata.customer_email === 'string' ? metadata.customer_email : null)) : null,
    renewal_consent_at: autoRenew && typeof metadata.renewal_consent_at === 'string' ? metadata.renewal_consent_at : null,
    renewal_terms_version: autoRenew && typeof metadata.renewal_terms_version === 'string' ? metadata.renewal_terms_version : null,
    cancel_at_period_end: false,
    last_payment_at: startsAt.toISOString(),
    failed_payment_count: 0,
    last_payment_error: null,
  }, { onConflict: 'source_order_id' });
  if (error) throw error;
  return true;
}
