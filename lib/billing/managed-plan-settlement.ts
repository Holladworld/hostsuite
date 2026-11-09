import { createAdminSupabaseClient } from '@/lib/supabase-admin';

type PaidManagedPlanOrder = {
  id: string;
  user_id: string;
  paid_at?: string | null;
  metadata: Record<string, unknown> | null;
};

/**
 * Records the prepaid care term after a verified payment.
 * Automatic collection remains off until gateway authorization and renewal
 * lifecycle support are implemented and tested.
 */
export async function activateManagedPlanSubscription(order: PaidManagedPlanOrder) {
  if (order.metadata?.source !== 'managed_plan') return false;

  const productId = typeof order.metadata.product_id === 'string' ? order.metadata.product_id : null;
  const planName = typeof order.metadata.plan_name === 'string' ? order.metadata.plan_name : null;
  const interval = order.metadata.interval === 'yearly' ? 'yearly' : order.metadata.interval === 'monthly' ? 'monthly' : null;
  if (!productId || !planName || !interval) throw new Error('Managed plan order metadata is incomplete.');

  const startsAt = order.paid_at ? new Date(order.paid_at) : new Date();
  const nextBillingAt = new Date(startsAt);
  if (interval === 'monthly') nextBillingAt.setUTCMonth(nextBillingAt.getUTCMonth() + 1);
  else nextBillingAt.setUTCFullYear(nextBillingAt.getUTCFullYear() + 1);

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('billing_subscriptions').upsert({
    user_id: order.user_id,
    product_id: productId,
    source_order_id: order.id,
    service_name: planName,
    amount: Number(order.metadata.term_amount),
    currency: typeof order.metadata.currency === 'string' ? order.metadata.currency : 'NGN',
    interval,
    status: 'active',
    next_billing_at: nextBillingAt.toISOString(),
    auto_renew: false,
  }, { onConflict: 'source_order_id' });
  if (error) throw error;
  return true;
}
