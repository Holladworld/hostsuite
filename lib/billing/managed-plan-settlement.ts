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
  nextBillingAt?: string | null;
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

  const metadata = order.metadata;
  const autoRenew = metadata.auto_renew === true;
  const provider = order.provider ?? (metadata.provider === 'paystack' || metadata.provider === 'flutterwave' ? metadata.provider : null);
  const admin = createAdminSupabaseClient();
  let existingCredentials: {
    provider_subscription_id: string | null;
    provider_subscription_token: string | null;
    provider_plan_id: string | null;
    provider_customer_email: string | null;
    provider_next_billing_at: string | null;
  } | null = null;

  if (autoRenew && provider) {
    const { data, error } = await admin.from('billing_subscription_provider_credentials')
      .select('provider_subscription_id,provider_subscription_token,provider_plan_id,provider_customer_email,provider_next_billing_at')
      .eq('order_id', order.id)
      .maybeSingle();
    if (error) throw error;
    existingCredentials = data;
  }

  const hasProviderMandate = Boolean(providerDetails.id ?? existingCredentials?.provider_subscription_id);
  const renewalSetupStatus = !autoRenew ? 'not_required' : hasProviderMandate ? 'confirmed' : 'pending';
  const startsAt = order.paid_at ? new Date(order.paid_at) : new Date();
  const providerNextBillingAt = providerDetails.nextBillingAt ?? existingCredentials?.provider_next_billing_at ?? null;
  const parsedProviderNext = providerNextBillingAt ? new Date(providerNextBillingAt) : null;
  const endsAt = autoRenew && parsedProviderNext && Number.isFinite(parsedProviderNext.getTime())
    ? parsedProviderNext
    : addPeriod(startsAt, interval);

  const { data: subscription, error } = await admin.from('billing_subscriptions').upsert({
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
    renewal_setup_status: renewalSetupStatus,
    provider: autoRenew ? provider : null,
    service_terms_accepted_at: typeof metadata.service_terms_accepted_at === 'string' ? metadata.service_terms_accepted_at : startsAt.toISOString(),
    service_terms_version: typeof metadata.service_terms_version === 'string' ? metadata.service_terms_version : null,
    renewal_consent_at: autoRenew && typeof metadata.renewal_consent_at === 'string' ? metadata.renewal_consent_at : null,
    renewal_terms_version: autoRenew && typeof metadata.renewal_terms_version === 'string' ? metadata.renewal_terms_version : null,
    cancel_at_period_end: !autoRenew,
    last_payment_at: startsAt.toISOString(),
    failed_payment_count: 0,
    last_payment_error: null,
  }, { onConflict: 'source_order_id' }).select('id').single();
  if (error) throw error;

  if (autoRenew && provider) {
    const { error: credentialsError } = await admin.from('billing_subscription_provider_credentials').upsert({
      order_id: order.id,
      subscription_id: subscription.id,
      provider,
      provider_subscription_id: providerDetails.id != null ? String(providerDetails.id) : existingCredentials?.provider_subscription_id ?? null,
      provider_subscription_token: providerDetails.token ?? existingCredentials?.provider_subscription_token ?? null,
      provider_plan_id: providerDetails.planId != null ? String(providerDetails.planId) : (typeof metadata.provider_plan_id === 'string' ? metadata.provider_plan_id : existingCredentials?.provider_plan_id ?? null),
      provider_customer_email: providerDetails.customerEmail?.toLowerCase() ?? (typeof metadata.customer_email === 'string' ? metadata.customer_email.toLowerCase() : existingCredentials?.provider_customer_email ?? null),
      provider_next_billing_at: providerNextBillingAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'order_id' });
    if (credentialsError) throw credentialsError;
  }
  return true;
}
