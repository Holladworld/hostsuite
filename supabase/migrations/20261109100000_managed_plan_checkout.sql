-- Managed-care plans are purchased as prepaid service terms.
-- Automatic recurring collection is intentionally disabled until gateway mandates,
-- renewal charging, cancellation and failed-payment recovery are implemented.

ALTER TABLE billing_subscriptions
  ADD COLUMN IF NOT EXISTS source_order_id uuid REFERENCES billing_orders(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subscriptions_source_order
  ON billing_subscriptions(source_order_id);

INSERT INTO billing_products (name, slug, description, product_type, billing_mode, currency, price, interval, active, metadata)
VALUES
  ('Starter Ops — Monthly', 'hostsuite-starter-ops-monthly', 'Starter Ops managed website care, prepaid monthly.', 'managed_service', 'one_time', 'NGN', 5000, NULL, true, '{"managed_plan_key":"starter_ops","term_interval":"monthly"}'::jsonb),
  ('Starter Ops — Annual', 'hostsuite-starter-ops-yearly', 'Starter Ops managed website care, prepaid annually.', 'managed_service', 'one_time', 'NGN', 50000, NULL, true, '{"managed_plan_key":"starter_ops","term_interval":"yearly"}'::jsonb),
  ('Managed Growth — Monthly', 'hostsuite-managed-growth-monthly', 'Managed Growth website care, prepaid monthly.', 'managed_service', 'one_time', 'NGN', 12000, NULL, true, '{"managed_plan_key":"managed_growth","term_interval":"monthly"}'::jsonb),
  ('Managed Growth — Annual', 'hostsuite-managed-growth-yearly', 'Managed Growth website care, prepaid annually.', 'managed_service', 'one_time', 'NGN', 120000, NULL, true, '{"managed_plan_key":"managed_growth","term_interval":"yearly"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  product_type = EXCLUDED.product_type,
  billing_mode = EXCLUDED.billing_mode,
  currency = EXCLUDED.currency,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  active = true,
  metadata = EXCLUDED.metadata,
  updated_at = now();
