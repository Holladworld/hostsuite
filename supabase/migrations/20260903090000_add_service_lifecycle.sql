-- HS: paid orders become explicit service instances before provider provisioning.
CREATE TABLE IF NOT EXISTS service_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES billing_orders(id) ON DELETE RESTRICT,
  order_item_id uuid NOT NULL REFERENCES billing_order_items(id) ON DELETE RESTRICT,
  product_id uuid REFERENCES billing_products(id) ON DELETE SET NULL,
  service_type text NOT NULL CHECK (service_type IN ('domain','hosting','email','website','monitoring','support','managed_service','ai_builder','other')),
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','paid','provisioning','active','provisioning_failed','suspended','cancelled')),
  provider text,
  provider_resource_id text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  provisioned_at timestamptz,
  UNIQUE(order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_service_instances_user ON service_instances(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_instances_order ON service_instances(order_id);
CREATE INDEX IF NOT EXISTS idx_service_instances_provider ON service_instances(provider, provider_resource_id);

ALTER TABLE service_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_service_instances" ON service_instances;
CREATE POLICY "users_read_own_service_instances" ON service_instances FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Replace the billing grant function so a verified paid order creates one service
-- instance per order item. Provider provisioning remains a separate server action.
CREATE OR REPLACE FUNCTION grant_billing_order_value(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item record;
  product record;
  order_row record;
BEGIN
  SELECT id, user_id, status INTO order_row FROM billing_orders WHERE id = p_order_id AND status = 'paid';
  IF order_row.id IS NULL THEN RETURN; END IF;

  FOR item IN SELECT * FROM billing_order_items WHERE order_id = p_order_id LOOP
    SELECT * INTO product FROM billing_products WHERE id = item.product_id;

    INSERT INTO billing_entitlements(user_id, product_id, order_id, quantity, remaining_quantity, starts_at)
    VALUES (order_row.user_id, item.product_id, p_order_id, item.quantity, item.quantity, now())
    ON CONFLICT (order_id, product_id) DO NOTHING;

    INSERT INTO service_instances(
      user_id, order_id, order_item_id, product_id, service_type, status,
      config, metadata, paid_at
    )
    VALUES (
      order_row.user_id,
      p_order_id,
      item.id,
      item.product_id,
      COALESCE(product.product_type, 'other'),
      'paid',
      COALESCE(item.metadata, '{}'::jsonb),
      jsonb_build_object('product_name', item.product_name),
      now()
    )
    ON CONFLICT (order_item_id) DO NOTHING;

    IF product.billing_mode = 'subscription' AND NOT EXISTS (
      SELECT 1 FROM billing_subscriptions
      WHERE user_id = order_row.user_id
        AND product_id = product.id
        AND status IN ('active','past_due','paused')
    ) THEN
      INSERT INTO billing_subscriptions(user_id, product_id, service_name, amount, currency, interval, status, next_billing_at, auto_renew)
      VALUES (
        order_row.user_id,
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
