import { createAdminSupabaseClient } from '@/lib/supabase-admin';

export type ManagedPlanKey = 'starter_ops' | 'managed_growth';
export type ManagedPlanInterval = 'monthly' | 'yearly';

const planNames: Record<ManagedPlanKey, string> = {
  starter_ops: 'Starter Ops',
  managed_growth: 'Managed Growth',
};

export function managedPlanSlug(planKey: ManagedPlanKey, interval: ManagedPlanInterval) {
  const plan = planKey === 'starter_ops' ? 'starter-ops' : 'managed-growth';
  return `hostsuite-${plan}-${interval === 'yearly' ? 'yearly' : 'monthly'}`;
}

export async function getManagedPlan(planKey: ManagedPlanKey, interval: ManagedPlanInterval) {
  const admin = createAdminSupabaseClient();
  const slug = managedPlanSlug(planKey, interval);
  const [{ data: product, error: productError }, { data: setting, error: settingError }] = await Promise.all([
    admin.from('billing_products').select('id,name,slug,price,currency,active,metadata').eq('slug', slug).eq('active', true).maybeSingle(),
    admin.from('site_settings').select('value').eq('key', 'pricing').maybeSingle(),
  ]);
  if (productError) throw productError;
  if (settingError) throw settingError;
  if (!product) return null;

  const pricing = setting?.value && typeof setting.value === 'object'
    ? setting.value as Record<string, unknown>
    : {};
  const overrideKey = `${planKey}_${interval === 'yearly' ? 'annual' : 'monthly'}`;
  const override = pricing[overrideKey];
  const amount = typeof override === 'number' && Number.isFinite(override) && override >= 0
    ? override
    : Number(product.price);

  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Managed plan price is invalid.');

  return {
    id: product.id as string,
    slug,
    name: planNames[planKey],
    interval,
    amount,
    currency: product.currency as string,
    metadata: (product.metadata && typeof product.metadata === 'object' ? product.metadata : {}) as Record<string, unknown>,
  };
}
