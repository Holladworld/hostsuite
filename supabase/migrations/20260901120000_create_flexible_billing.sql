-- HS-012 Billing: flexible catalog, orders, invoices, subscriptions and usage.
-- Prices are data, not code, so Admin/CMS can change them without redeploying.

CREATE TABLE IF NOT EXISTS billing_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  product_type text NOT NULL CHECK (product_type IN ('domain','hosting','email','website','monitoring','support','managed_service','ai_builder','other')),
  billing_mode text NOT NULL CHECK (billing_mode IN ('one_time','subscription','metered')),
  currency text NOT NULL DEFAULT 'NGN',
  price numeric(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  interval text CHECK (interval IN ('monthly','yearly')),
  active boolean NOT NULL DEFAULT true,
  included_credits integer CHECK (included_credits IS NULL OR included_credits >= 0),
  unit_label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((billing_mode = 'subscription' AND interval IS NOT NULL) OR billing_mode <> 'subscription')
);

CREATE TABLE IF NOT EXISTS billing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled','refunded')),
  currency text NOT NULL DEFAULT 'NGN',
  subtotal numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  provider text CHECK (provider IN ('paystack','flutterwave','manual','other')),
  provider_reference text,
  idempotency_key text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE TABLE IF NOT EXISTS billing_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES billing_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES billing_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES billing_orders(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','paid','void','uncollectible')),
  currency text NOT NULL DEFAULT 'NGN',
  subtotal numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES billing_products(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  interval text NOT NULL CHECK (interval IN ('monthly','yearly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','paused')),
  next_billing_at timestamptz,
  auto_renew boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz
);

CREATE TABLE IF NOT EXISTS billing_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES billing_products(id) ON DELETE CASCADE,
  units numeric(14,4) NOT NULL CHECK (units > 0),
  unit_label text NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  processed boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_orders_user ON billing_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_user ON billing_invoices(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user ON billing_subscriptions(user_id, next_billing_at);
CREATE INDEX IF NOT EXISTS idx_billing_usage_user ON billing_usage(user_id, product_id, created_at DESC);

ALTER TABLE billing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_billing_products" ON billing_products;
CREATE POLICY "public_read_active_billing_products" ON billing_products FOR SELECT TO anon, authenticated USING (active = true);

DROP POLICY IF EXISTS "users_read_own_billing_orders" ON billing_orders;
CREATE POLICY "users_read_own_billing_orders" ON billing_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_read_own_billing_order_items" ON billing_order_items;
CREATE POLICY "users_read_own_billing_order_items" ON billing_order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM billing_orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

DROP POLICY IF EXISTS "users_read_own_billing_invoices" ON billing_invoices;
CREATE POLICY "users_read_own_billing_invoices" ON billing_invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_read_own_billing_subscriptions" ON billing_subscriptions;
CREATE POLICY "users_read_own_billing_subscriptions" ON billing_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_read_own_billing_usage" ON billing_usage;
CREATE POLICY "users_read_own_billing_usage" ON billing_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Webhook events are server-owned. No client SELECT/INSERT/UPDATE/DELETE policy is created.
