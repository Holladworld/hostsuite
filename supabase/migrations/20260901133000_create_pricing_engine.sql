/*
  HS-012 Pricing Engine

  Extends the existing flexible billing foundation without replacing it.
  Prices, supplier economics, discounts, credits, tax and payment fees are
  configuration data so Admin can change them without a code deployment.

  Depends on:
    - billing_products
    - billing_orders
    - billing_order_items
    - billing_subscriptions
    - billing_usage
    - public.is_admin()
*/

-- ============================================================
-- Price versions / supplier economics
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_price_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES billing_products(id) ON DELETE CASCADE,
  supplier_name text,
  supplier_product_ref text,
  supplier_cost numeric(14,2) CHECK (supplier_cost IS NULL OR supplier_cost >= 0),
  supplier_currency text NOT NULL DEFAULT 'NGN',
  direct_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (direct_cost >= 0),
  retail_price numeric(14,2) NOT NULL CHECK (retail_price >= 0),
  target_margin_pct numeric(6,3) CHECK (target_margin_pct IS NULL OR target_margin_pct >= 0),
  minimum_margin_pct numeric(6,3) CHECK (minimum_margin_pct IS NULL OR minimum_margin_pct >= 0),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_billing_price_versions_product_active
  ON billing_price_versions(product_id, active, starts_at DESC);

-- ============================================================
-- Promotions / discount rules
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed','credit')),
  discount_value numeric(14,2) NOT NULL CHECK (discount_value >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  max_discount numeric(14,2) CHECK (max_discount IS NULL OR max_discount >= 0),
  min_order_amount numeric(14,2) CHECK (min_order_amount IS NULL OR min_order_amount >= 0),
  minimum_margin_pct numeric(6,3) CHECK (minimum_margin_pct IS NULL OR minimum_margin_pct >= 0),
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  per_customer_limit integer CHECK (per_customer_limit IS NULL OR per_customer_limit > 0),
  first_order_only boolean NOT NULL DEFAULT false,
  stackable boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  eligible_product_types text[] NOT NULL DEFAULT '{}',
  eligible_product_slugs text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_promotions_active_window
  ON billing_promotions(active, starts_at, ends_at);

-- ============================================================
-- Customer credits / referral rewards / refunds
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('grant','purchase','spend','refund','referral','adjustment','expiry')),
  amount numeric(14,2) NOT NULL CHECK (amount <> 0),
  currency text NOT NULL DEFAULT 'NGN',
  source text NOT NULL,
  reference text,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','void')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_credit_ledger_user
  ON billing_credit_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','qualified','rewarded','expired','cancelled')),
  qualifying_order_id uuid REFERENCES billing_orders(id) ON DELETE SET NULL,
  reward_amount numeric(14,2) CHECK (reward_amount IS NULL OR reward_amount >= 0),
  reward_currency text NOT NULL DEFAULT 'NGN',
  rewarded_at timestamptz,
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_referrals_referrer
  ON billing_referrals(referrer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_referrals_referred
  ON billing_referrals(referred_user_id, created_at DESC);

-- ============================================================
-- Tax configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,
  tax_name text NOT NULL,
  rate_pct numeric(7,4) NOT NULL CHECK (rate_pct >= 0),
  price_inclusive boolean NOT NULL DEFAULT false,
  taxable_product_types text[] NOT NULL DEFAULT '{}',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_billing_tax_rules_lookup
  ON billing_tax_rules(jurisdiction, active, starts_at DESC);

-- ============================================================
-- Payment processor fee configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_payment_fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('paystack','flutterwave','manual','other')),
  currency text NOT NULL DEFAULT 'NGN',
  percentage_fee numeric(7,4) NOT NULL DEFAULT 0 CHECK (percentage_fee >= 0),
  fixed_fee numeric(14,2) NOT NULL DEFAULT 0 CHECK (fixed_fee >= 0),
  fee_cap numeric(14,2) CHECK (fee_cap IS NULL OR fee_cap >= 0),
  pass_to_customer boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_billing_payment_fee_rules_lookup
  ON billing_payment_fee_rules(provider, currency, active, starts_at DESC);

-- ============================================================
-- Order snapshots and calculated totals
-- ============================================================
ALTER TABLE billing_orders
  ADD COLUMN IF NOT EXISTS discount_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  ADD COLUMN IF NOT EXISTS credit_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (credit_total >= 0),
  ADD COLUMN IF NOT EXISTS tax_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  ADD COLUMN IF NOT EXISTS payment_fee_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (payment_fee_total >= 0),
  ADD COLUMN IF NOT EXISTS pricing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES billing_promotions(id) ON DELETE SET NULL;

ALTER TABLE billing_order_items
  ADD COLUMN IF NOT EXISTS price_version_id uuid REFERENCES billing_price_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  ADD COLUMN IF NOT EXISTS cost_snapshot numeric(14,2) CHECK (cost_snapshot IS NULL OR cost_snapshot >= 0);

ALTER TABLE billing_subscriptions
  ADD COLUMN IF NOT EXISTS price_version_id uuid REFERENCES billing_price_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE billing_price_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payment_fee_rules ENABLE ROW LEVEL SECURITY;

-- Price versions, supplier costs, tax rules and payment fees are internal.
-- Customers must never read supplier economics or margin rules directly.
DROP POLICY IF EXISTS "admin_manage_billing_price_versions" ON billing_price_versions;
CREATE POLICY "admin_manage_billing_price_versions" ON billing_price_versions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_billing_promotions" ON billing_promotions;
CREATE POLICY "admin_manage_billing_promotions" ON billing_promotions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_billing_tax_rules" ON billing_tax_rules;
CREATE POLICY "admin_manage_billing_tax_rules" ON billing_tax_rules
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_billing_payment_fee_rules" ON billing_payment_fee_rules;
CREATE POLICY "admin_manage_billing_payment_fee_rules" ON billing_payment_fee_rules
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users_read_own_billing_credit_ledger" ON billing_credit_ledger;
CREATE POLICY "users_read_own_billing_credit_ledger" ON billing_credit_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_write_billing_credit_ledger" ON billing_credit_ledger;
CREATE POLICY "admin_write_billing_credit_ledger" ON billing_credit_ledger
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users_read_own_billing_referrals" ON billing_referrals;
CREATE POLICY "users_read_own_billing_referrals" ON billing_referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_manage_billing_referrals" ON billing_referrals;
CREATE POLICY "admin_manage_billing_referrals" ON billing_referrals
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Safe helper: calculate suggested retail from a desired margin.
-- This is advisory only; Admin can override the resulting price.
-- ============================================================
CREATE OR REPLACE FUNCTION public.suggest_retail_price(
  p_direct_cost numeric,
  p_target_margin_pct numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_direct_cost IS NULL OR p_direct_cost < 0 THEN NULL
    WHEN p_target_margin_pct IS NULL OR p_target_margin_pct < 0 OR p_target_margin_pct >= 100 THEN NULL
    ELSE round(p_direct_cost / (1 - (p_target_margin_pct / 100)), 2)
  END;
$$;

COMMENT ON FUNCTION public.suggest_retail_price(numeric, numeric)
IS 'Advisory pricing helper. Returns the retail price required to achieve a target gross margin. It does not modify product prices.';
