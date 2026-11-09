-- Managed-care plans use provider-native recurring subscriptions by default.
-- Customers may explicitly opt out during checkout; that produces a prepaid term
-- without a provider mandate. Provider secrets/tokens are server-only columns.

ALTER TABLE billing_subscriptions
  ADD COLUMN IF NOT EXISTS source_order_id uuid REFERENCES billing_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider text CHECK (provider IN ('paystack','flutterwave')),
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS provider_subscription_token text,
  ADD COLUMN IF NOT EXISTS provider_plan_id text,
  ADD COLUMN IF NOT EXISTS provider_customer_email text,
  ADD COLUMN IF NOT EXISTS renewal_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewal_terms_version text,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_payment_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_payment_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_error text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subscriptions_source_order
  ON billing_subscriptions(source_order_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subscriptions_provider_reference
  ON billing_subscriptions(provider, provider_subscription_id)
  WHERE provider IS NOT NULL AND provider_subscription_id IS NOT NULL;

INSERT INTO billing_products (name, slug, description, product_type, billing_mode, currency, price, interval, active, metadata)
VALUES
  ('Starter Ops — Monthly', 'hostsuite-starter-ops-monthly', 'Starter Ops managed website care, billed monthly until cancelled.', 'managed_service', 'subscription', 'NGN', 5000, 'monthly', true, '{"managed_plan_key":"starter_ops","term_interval":"monthly"}'::jsonb),
  ('Starter Ops — Annual', 'hostsuite-starter-ops-yearly', 'Starter Ops managed website care, billed annually until cancelled.', 'managed_service', 'subscription', 'NGN', 50000, 'yearly', true, '{"managed_plan_key":"starter_ops","term_interval":"yearly"}'::jsonb),
  ('Managed Growth — Monthly', 'hostsuite-managed-growth-monthly', 'Managed Growth website care, billed monthly until cancelled.', 'managed_service', 'subscription', 'NGN', 12000, 'monthly', true, '{"managed_plan_key":"managed_growth","term_interval":"monthly"}'::jsonb),
  ('Managed Growth — Annual', 'hostsuite-managed-growth-yearly', 'Managed Growth website care, billed annually until cancelled.', 'managed_service', 'subscription', 'NGN', 120000, 'yearly', true, '{"managed_plan_key":"managed_growth","term_interval":"yearly"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  product_type = EXCLUDED.product_type,
  billing_mode = EXCLUDED.billing_mode,
  currency = EXCLUDED.currency,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  active = true,
  metadata = billing_products.metadata || EXCLUDED.metadata,
  updated_at = now();
