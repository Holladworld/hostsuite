-- Customer checkout foundation: clients may create an order only through this
-- function. The database remains the source of truth for product price/identity.

CREATE OR REPLACE FUNCTION create_customer_order(
  p_product_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_product billing_products%ROWTYPE;
  v_order_id uuid;
  v_key text := gen_random_uuid()::text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT * INTO v_product
  FROM billing_products
  WHERE id = p_product_id AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  INSERT INTO billing_orders (
    user_id, status, currency, subtotal, total, idempotency_key, metadata
  ) VALUES (
    v_user_id, 'pending', v_product.currency,
    v_product.price, v_product.price, v_key,
    jsonb_build_object('source', 'customer_portal')
  ) RETURNING id INTO v_order_id;

  INSERT INTO billing_order_items (
    order_id, product_id, product_name, quantity, unit_price, total, metadata
  ) VALUES (
    v_order_id, v_product.id, v_product.name, 1,
    v_product.price, v_product.price, COALESCE(p_metadata, '{}'::jsonb)
  );

  INSERT INTO billing_invoices (
    user_id, order_id, invoice_number, status, currency, subtotal, total
  ) VALUES (
    v_user_id, v_order_id,
    'HS-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 12)),
    'open', v_product.currency, v_product.price, v_product.price
  );

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION create_customer_order(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_customer_order(uuid, jsonb) TO authenticated;
