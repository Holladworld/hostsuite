-- Grantable customer value is separate from payment state.
CREATE TABLE IF NOT EXISTS billing_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES billing_products(id) ON DELETE SET NULL,
  order_id uuid NOT NULL REFERENCES billing_orders(id) ON DELETE CASCADE,
  quantity numeric(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  remaining_quantity numeric(12,2) NOT NULL DEFAULT 1 CHECK (remaining_quantity >= 0),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','exhausted','expired','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, product_id)
);

ALTER TABLE billing_entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_entitlements" ON billing_entitlements;
CREATE POLICY "users_read_own_entitlements" ON billing_entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_billing_entitlements_user ON billing_entitlements(user_id, status, ends_at);

CREATE OR REPLACE FUNCTION grant_billing_order_value(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item record;
  product record;
  order_user uuid;
BEGIN
  SELECT user_id INTO order_user FROM billing_orders WHERE id = p_order_id AND status = 'paid';
  IF order_user IS NULL THEN RETURN; END IF;

  FOR item IN SELECT * FROM billing_order_items WHERE order_id = p_order_id LOOP
    SELECT * INTO product FROM billing_products WHERE id = item.product_id;

    INSERT INTO billing_entitlements(user_id, product_id, order_id, quantity, remaining_quantity, starts_at)
    VALUES (order_user, item.product_id, p_order_id, item.quantity, item.quantity, now())
    ON CONFLICT (order_id, product_id) DO NOTHING;

    IF product.billing_mode = 'subscription' AND NOT EXISTS (
      SELECT 1 FROM billing_subscriptions WHERE user_id = order_user AND product_id = product.id AND status IN ('active','past_due','paused')
    ) THEN
      INSERT INTO billing_subscriptions(user_id, product_id, service_name, amount, currency, interval, status, next_billing_at, auto_renew)
      VALUES (
        order_user,
        product.id,
        product.name,
        product.price,
        product.currency,
        product.interval,
        'active',
        CASE WHEN product.interval = 'monthly' THEN now() + interval '1 month' ELSE now() + interval '1 year' END,
        true
      );
    END IF;
  END LOOP;
END;
$$;
