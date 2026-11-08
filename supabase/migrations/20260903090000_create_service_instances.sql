-- HS: Service instances are the durable customer-facing representation of purchased services.
-- A service instance is created from a paid order item. Domain, hosting, email, website,
-- monitoring and other services remain independent; a customer is never forced to buy hosting.

CREATE TABLE IF NOT EXISTS service_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES billing_orders(id) ON DELETE RESTRICT,
  order_item_id uuid NOT NULL REFERENCES billing_order_items(id) ON DELETE RESTRICT,
  product_id uuid REFERENCES billing_products(id) ON DELETE SET NULL,
  service_type text NOT NULL CHECK (service_type IN ('domain','hosting','email','website','monitoring','support','managed_service','ai_builder','other')),
  service_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','paid','provisioning','active','provisioning_failed','suspended','cancelled')),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider text,
  provider_resource_id text,
  provider_status text,
  control_panel_url text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  provisioned_at timestamptz,
  suspended_at timestamptz,
  cancelled_at timestamptz,
  UNIQUE(order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_service_instances_user ON service_instances(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_instances_order ON service_instances(order_id);
CREATE INDEX IF NOT EXISTS idx_service_instances_status ON service_instances(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_instances_type ON service_instances(service_type, status);

ALTER TABLE service_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_service_instances" ON service_instances;
CREATE POLICY "users_read_own_service_instances"
  ON service_instances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service lifecycle transitions are server-owned. Clients cannot insert or mutate instances.

CREATE OR REPLACE FUNCTION create_service_instances_for_order(p_order_id uuid)
RETURNS SETOF service_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row billing_orders%ROWTYPE;
BEGIN
  SELECT * INTO order_row
  FROM billing_orders
  WHERE id = p_order_id;

  IF NOT FOUND OR order_row.status <> 'paid' THEN
    RETURN;
  END IF;

  INSERT INTO service_instances (
    user_id,
    order_id,
    order_item_id,
    product_id,
    service_type,
    service_name,
    status,
    configuration,
    provider,
    paid_at
  )
  SELECT
    order_row.user_id,
    item.order_id,
    item.id,
    item.product_id,
    COALESCE(product.product_type, 'other'),
    item.product_name,
    'paid',
    COALESCE(item.metadata, '{}'::jsonb),
    CASE
      WHEN COALESCE(product.product_type, 'other') IN ('domain','hosting','email') THEN 'whogohost'
      ELSE NULL
    END,
    order_row.paid_at
  FROM billing_order_items item
  LEFT JOIN billing_products product ON product.id = item.product_id
  WHERE item.order_id = p_order_id
  ON CONFLICT (order_item_id) DO NOTHING;

  RETURN QUERY
  SELECT * FROM service_instances WHERE order_id = p_order_id ORDER BY created_at;
END;
$$;

-- Keep updated_at correct for future lifecycle transitions.
CREATE OR REPLACE FUNCTION touch_service_instance_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_instances_updated_at ON service_instances;
CREATE TRIGGER service_instances_updated_at
  BEFORE UPDATE ON service_instances
  FOR EACH ROW EXECUTE FUNCTION touch_service_instance_updated_at();
