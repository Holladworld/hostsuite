-- HS-014: harden checkout order creation, payment settlement and provisioning authorization.
-- Apply only after reviewing against the live Supabase migration history.

ALTER TABLE public.billing_orders
  ADD COLUMN IF NOT EXISTS payment_authorization_url text;

ALTER TABLE public.billing_subscriptions
  ADD COLUMN IF NOT EXISTS renewal_setup_status text NOT NULL DEFAULT 'not_required'
    CHECK (renewal_setup_status IN ('not_required','pending','confirmed','failed'));

ALTER TABLE public.billing_webhook_events
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_attempts integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.create_billing_checkout_order(
  p_user_id uuid,
  p_provider text,
  p_provider_reference text,
  p_idempotency_key text,
  p_items jsonb
)
RETURNS TABLE(order_id uuid, invoice_number text, total numeric, currency text, provider_reference text, reused boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  product_row public.billing_products%ROWTYPE;
  product_id uuid;
  item_quantity numeric;
  item_metadata jsonb;
  item_total numeric;
  order_total numeric := 0;
  order_currency text := 'NGN';
  item_count integer := 0;
  services text[] := ARRAY[]::text[];
  order_uuid uuid;
  invoice_no text;
  fingerprint text;
  existing_order public.billing_orders%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_provider IS NULL OR p_provider NOT IN ('paystack','flutterwave')
    OR NULLIF(trim(p_provider_reference), '') IS NULL
    OR NULLIF(trim(p_idempotency_key), '') IS NULL
    OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'INVALID_CHECKOUT_ORDER_INPUT';
  END IF;
  IF jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'INVALID_CHECKOUT_ORDER_INPUT';
  END IF;

  fingerprint := md5(p_items::text);
  SELECT * INTO existing_order FROM public.billing_orders
  WHERE idempotency_key = p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    IF existing_order.user_id <> p_user_id
      OR existing_order.provider <> p_provider
      OR existing_order.metadata->>'checkout_fingerprint' <> fingerprint
      OR existing_order.status <> 'pending' THEN
      RAISE EXCEPTION 'IDEMPOTENCY_KEY_CONFLICT';
    END IF;
    SELECT i.invoice_number INTO invoice_no
    FROM public.billing_invoices i WHERE i.order_id = existing_order.id LIMIT 1;
    RETURN QUERY SELECT existing_order.id, invoice_no, existing_order.total,
      existing_order.currency, existing_order.provider_reference, true;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) AS e(value)
    GROUP BY value->>'product_id' HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_CHECKOUT_PRODUCT';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    BEGIN
      product_id := (item->>'product_id')::uuid;
      item_quantity := COALESCE((item->>'quantity')::numeric, 1);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'INVALID_CHECKOUT_ITEM';
    END;

    IF item_quantity < 1 OR item_quantity > 100 OR item_quantity <> trunc(item_quantity) THEN
      RAISE EXCEPTION 'INVALID_CHECKOUT_QUANTITY';
    END IF;

    SELECT * INTO product_row FROM public.billing_products
    WHERE id = product_id AND active = true FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'CHECKOUT_PRODUCT_UNAVAILABLE'; END IF;
    IF product_row.billing_mode <> 'one_time' THEN
      RAISE EXCEPTION 'UNSUPPORTED_CHECKOUT_BILLING_MODE';
    END IF;
    IF product_row.product_type IN ('domain','hosting','email','website','managed_service')
      AND item_quantity <> 1 THEN
      RAISE EXCEPTION 'SERVICE_QUANTITY_MUST_BE_ONE';
    END IF;
    IF product_row.currency <> order_currency OR product_row.price <= 0 THEN
      RAISE EXCEPTION 'UNSUPPORTED_CHECKOUT_PRICE_OR_CURRENCY';
    END IF;

    item_metadata := COALESCE(item->'metadata', '{}'::jsonb);
    IF jsonb_typeof(item_metadata) <> 'object' THEN
      RAISE EXCEPTION 'INVALID_CHECKOUT_CONFIGURATION';
    END IF;

    item_total := round(product_row.price * item_quantity, 2);
    order_total := order_total + item_total;
    item_count := item_count + 1;
    services := array_append(services, product_row.product_type);

    -- Validate all items before creating any durable order records.
  END LOOP;

  IF item_count < 1 OR order_total <= 0 OR order_total > 999999999999.99 THEN
    RAISE EXCEPTION 'INVALID_CHECKOUT_TOTAL';
  END IF;

  order_uuid := gen_random_uuid();
  invoice_no := 'HS-' || extract(year FROM now())::integer::text || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  INSERT INTO public.billing_orders(
    id, user_id, status, currency, subtotal, total, provider,
    provider_reference, idempotency_key, metadata
  ) VALUES (
    order_uuid, p_user_id, 'pending', order_currency, order_total, order_total,
    p_provider, p_provider_reference, p_idempotency_key,
    jsonb_build_object(
      'source','portal',
      'services',to_jsonb(services),
      'checkout_fingerprint',fingerprint
    )
  );

  FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    product_id := (item->>'product_id')::uuid;
    item_quantity := COALESCE((item->>'quantity')::numeric, 1);
    item_metadata := COALESCE(item->'metadata', '{}'::jsonb);
    SELECT * INTO product_row FROM public.billing_products WHERE id = product_id;
    item_total := round(product_row.price * item_quantity, 2);
    INSERT INTO public.billing_order_items(
      order_id, product_id, product_name, quantity, unit_price, total, metadata
    ) VALUES (
      order_uuid, product_row.id, product_row.name, item_quantity,
      product_row.price, item_total, item_metadata
    );
  END LOOP;

  INSERT INTO public.billing_invoices(
    user_id, order_id, invoice_number, status, currency, subtotal, total
  ) VALUES (
    p_user_id, order_uuid, invoice_no, 'open', order_currency, order_total, order_total
  );

  RETURN QUERY SELECT order_uuid, invoice_no, order_total, order_currency, p_provider_reference, false;
END;
$$;

REVOKE ALL ON FUNCTION public.create_billing_checkout_order(uuid,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_billing_checkout_order(uuid,text,text,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.create_managed_plan_checkout_order(
  p_user_id uuid,
  p_provider text,
  p_provider_reference text,
  p_idempotency_key text,
  p_product_id uuid,
  p_amount numeric,
  p_currency text,
  p_metadata jsonb
)
RETURNS TABLE(order_id uuid, invoice_number text, total numeric, currency text, provider_reference text, reused boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_row public.billing_products%ROWTYPE;
  new_order_id uuid := gen_random_uuid();
  invoice_no text;
  auto_renew boolean;
  existing_order public.billing_orders%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_provider IS NULL OR p_provider NOT IN ('paystack','flutterwave')
    OR NULLIF(trim(p_provider_reference), '') IS NULL
    OR NULLIF(trim(p_idempotency_key), '') IS NULL
    OR p_amount IS NULL OR p_amount <= 0 OR p_amount > 999999999999.99
    OR p_currency IS NULL OR p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object'
    OR p_metadata->>'source' IS DISTINCT FROM 'managed_plan'
    OR p_metadata->>'product_id' IS DISTINCT FROM p_product_id::text
    OR p_metadata->>'term_amount' IS NULL
    OR (p_metadata->>'term_amount')::numeric <> p_amount
    OR p_metadata->>'currency' IS DISTINCT FROM p_currency
    OR p_metadata->>'service_terms_accepted_at' IS NULL
    OR p_metadata->>'service_terms_version' IS NULL THEN
    RAISE EXCEPTION 'INVALID_MANAGED_PLAN_ORDER';
  END IF;

  SELECT * INTO existing_order FROM public.billing_orders
  WHERE idempotency_key = p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    IF existing_order.user_id <> p_user_id
      OR existing_order.provider <> p_provider
      OR existing_order.status <> 'pending'
      OR existing_order.total <> p_amount
      OR existing_order.currency <> p_currency
      OR existing_order.metadata->>'source' IS DISTINCT FROM 'managed_plan'
      OR existing_order.metadata->>'product_id' IS DISTINCT FROM p_metadata->>'product_id'
      OR existing_order.metadata->>'plan_key' IS DISTINCT FROM p_metadata->>'plan_key'
      OR existing_order.metadata->>'interval' IS DISTINCT FROM p_metadata->>'interval'
      OR existing_order.metadata->>'auto_renew' IS DISTINCT FROM p_metadata->>'auto_renew'
      OR existing_order.metadata->>'provider_plan_id' IS DISTINCT FROM p_metadata->>'provider_plan_id' THEN
      RAISE EXCEPTION 'IDEMPOTENCY_KEY_CONFLICT';
    END IF;
    SELECT i.invoice_number INTO invoice_no
    FROM public.billing_invoices i WHERE i.order_id = existing_order.id LIMIT 1;
    RETURN QUERY SELECT existing_order.id, invoice_no, existing_order.total,
      existing_order.currency, existing_order.provider_reference, true;
    RETURN;
  END IF;

  auto_renew := COALESCE((p_metadata->>'auto_renew')::boolean, false);
  IF auto_renew AND (
    p_metadata->>'renewal_consent_at' IS NULL
    OR p_metadata->>'renewal_terms_version' IS NULL
    OR p_metadata->>'provider_plan_id' IS NULL
  ) THEN
    RAISE EXCEPTION 'RECURRING_CONSENT_OR_PLAN_MISSING';
  END IF;

  SELECT * INTO product_row FROM public.billing_products
  WHERE id = p_product_id AND active = true FOR SHARE;
  IF NOT FOUND OR product_row.product_type <> 'managed_service'
    OR product_row.billing_mode <> 'subscription'
    OR product_row.currency <> p_currency
    OR product_row.interval IS DISTINCT FROM p_metadata->>'interval' THEN
    RAISE EXCEPTION 'MANAGED_PLAN_PRODUCT_MISMATCH';
  END IF;

  invoice_no := 'HS-' || extract(year FROM now())::integer::text || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  INSERT INTO public.billing_orders(
    id, user_id, status, currency, subtotal, total, provider,
    provider_reference, idempotency_key, metadata
  ) VALUES (
    new_order_id, p_user_id, 'pending', p_currency, p_amount, p_amount,
    p_provider, p_provider_reference, p_idempotency_key, p_metadata
  );

  INSERT INTO public.billing_order_items(
    order_id, product_id, product_name, quantity, unit_price, total, metadata
  ) VALUES (
    new_order_id, product_row.id, product_row.name, 1, p_amount, p_amount, p_metadata
  );

  INSERT INTO public.billing_invoices(
    user_id, order_id, invoice_number, status, currency, subtotal, total
  ) VALUES (
    p_user_id, new_order_id, invoice_no, 'open', p_currency, p_amount, p_amount
  );

  RETURN QUERY SELECT new_order_id, invoice_no, p_amount, p_currency, p_provider_reference, false;
END;
$$;

REVOKE ALL ON FUNCTION public.create_managed_plan_checkout_order(uuid,text,text,text,uuid,numeric,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_managed_plan_checkout_order(uuid,text,text,text,uuid,numeric,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.settle_verified_billing_order(
  p_order_id uuid,
  p_provider text,
  p_provider_reference text,
  p_amount numeric,
  p_currency text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.billing_orders%ROWTYPE;
BEGIN
  SELECT * INTO order_row FROM public.billing_orders
  WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'BILLING_ORDER_NOT_FOUND'; END IF;

  IF order_row.provider IS DISTINCT FROM p_provider
    OR order_row.provider_reference IS DISTINCT FROM p_provider_reference
    OR order_row.total IS DISTINCT FROM p_amount
    OR order_row.currency IS DISTINCT FROM p_currency THEN
    RAISE EXCEPTION 'VERIFIED_PAYMENT_ORDER_MISMATCH';
  END IF;

  IF order_row.status = 'paid' THEN RETURN 'already_paid'; END IF;
  IF order_row.status <> 'pending' THEN
    RETURN 'reconciliation_required';
  END IF;

  UPDATE public.billing_orders
  SET status = 'paid', paid_at = COALESCE(paid_at, now()), payment_authorization_url = NULL
  WHERE id = p_order_id AND status = 'pending';
  UPDATE public.billing_invoices
  SET status = 'paid', paid_at = COALESCE(paid_at, now())
  WHERE order_id = p_order_id AND status IN ('open','draft');

  RETURN 'paid';
END;
$$;

REVOKE ALL ON FUNCTION public.settle_verified_billing_order(uuid,text,text,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_verified_billing_order(uuid,text,text,numeric,text) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_billing_webhook_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_payload jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_id uuid;
BEGIN
  IF p_provider NOT IN ('paystack','flutterwave')
    OR NULLIF(trim(p_event_id), '') IS NULL
    OR NULLIF(trim(p_event_type), '') IS NULL THEN
    RAISE EXCEPTION 'INVALID_WEBHOOK_EVENT_ID';
  END IF;

  INSERT INTO public.billing_webhook_events(
    provider, event_id, event_type, signature_valid, processed, payload,
    processing_started_at, processing_attempts
  ) VALUES (
    p_provider, p_event_id, p_event_type, true, false, COALESCE(p_payload, '{}'::jsonb),
    now(), 1
  )
  ON CONFLICT (provider, event_id) DO UPDATE
  SET event_type = EXCLUDED.event_type,
      payload = EXCLUDED.payload,
      signature_valid = true,
      processing_started_at = now(),
      processing_attempts = public.billing_webhook_events.processing_attempts + 1
  WHERE public.billing_webhook_events.processed = false
    AND (
      public.billing_webhook_events.processing_started_at IS NULL
      OR public.billing_webhook_events.processing_started_at < now() - interval '5 minutes'
    )
  RETURNING id INTO claimed_id;

  RETURN claimed_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_billing_webhook_event(text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_billing_webhook_event(text,text,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.begin_service_provisioning(p_service_instance_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_no integer;
  provider_name text;
BEGIN
  UPDATE public.service_instances si
  SET status = 'provisioning', last_error = null
  FROM public.billing_orders o, public.billing_order_items oi
  WHERE si.id = p_service_instance_id
    AND si.status IN ('paid', 'provisioning_failed')
    AND o.id = si.order_id
    AND o.status = 'paid'
    AND o.user_id = si.user_id
    AND oi.id = si.order_item_id
    AND oi.order_id = o.id
    AND oi.product_id IS NOT DISTINCT FROM si.product_id
    AND EXISTS (
      SELECT 1 FROM public.billing_products p
      WHERE p.id = oi.product_id AND p.product_type = si.service_type
    )
  RETURNING COALESCE(si.provider, 'unconfigured') INTO provider_name;

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(MAX(attempt_no), 0) + 1 INTO next_no
  FROM public.provisioning_attempts
  WHERE service_instance_id = p_service_instance_id;

  INSERT INTO public.provisioning_attempts(service_instance_id, attempt_no, provider, status)
  VALUES (p_service_instance_id, next_no, provider_name, 'started');

  RETURN next_no;
END;
$$;

REVOKE ALL ON FUNCTION public.begin_service_provisioning(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_service_provisioning(uuid) TO service_role;

-- Keep the database-level entitlement grant tied to a complete paid order snapshot.
CREATE OR REPLACE FUNCTION public.grant_billing_order_value(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.billing_orders%ROWTYPE;
  item record;
  product_row public.billing_products%ROWTYPE;
  item_sum numeric(14,2);
BEGIN
  SELECT * INTO order_row FROM public.billing_orders
  WHERE id = p_order_id AND status = 'paid' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_PAID'; END IF;

  SELECT COALESCE(round(sum(total), 2), 0) INTO item_sum
  FROM public.billing_order_items WHERE order_id = p_order_id;
  IF item_sum <= 0 OR item_sum <> order_row.total THEN
    RAISE EXCEPTION 'ORDER_ITEM_TOTAL_MISMATCH';
  END IF;

  FOR item IN SELECT * FROM public.billing_order_items WHERE order_id = p_order_id LOOP
    SELECT * INTO product_row FROM public.billing_products WHERE id = item.product_id;
    IF NOT FOUND OR item.quantity < 1 OR item.quantity <> trunc(item.quantity)
      OR item.total <> round(item.unit_price * item.quantity, 2) THEN
      RAISE EXCEPTION 'ORDER_ITEM_CATALOGUE_MISMATCH';
    END IF;

    INSERT INTO public.billing_entitlements(user_id, product_id, order_id, quantity, remaining_quantity, starts_at)
    VALUES (order_row.user_id, item.product_id, p_order_id, item.quantity, item.quantity, now())
    ON CONFLICT (order_id, product_id) DO NOTHING;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_billing_order_value(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_billing_order_value(uuid) TO service_role;

-- Only provider-backed infrastructure products become provisionable service instances.
-- Other paid catalogue items retain their entitlements and use their own fulfilment workflow.
CREATE OR REPLACE FUNCTION public.create_service_instances_for_order(p_order_id uuid)
RETURNS SETOF public.service_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.billing_orders%ROWTYPE;
BEGIN
  SELECT * INTO order_row FROM public.billing_orders
  WHERE id = p_order_id FOR SHARE;
  IF NOT FOUND OR order_row.status <> 'paid' THEN RETURN; END IF;

  INSERT INTO public.service_instances (
    user_id, order_id, order_item_id, product_id, service_type,
    service_name, status, configuration, provider, paid_at
  )
  SELECT
    order_row.user_id, item.order_id, item.id, item.product_id,
    product.product_type, item.product_name, 'paid',
    COALESCE(item.metadata, '{}'::jsonb),
    CASE WHEN product.product_type IN ('domain','hosting','email') THEN 'whogohost' ELSE NULL END,
    order_row.paid_at
  FROM public.billing_order_items item
  JOIN public.billing_products product ON product.id = item.product_id
  WHERE item.order_id = p_order_id
    AND product.product_type IN ('domain','hosting','email')
    AND item.quantity = 1
    AND item.total = item.unit_price
  ON CONFLICT (order_item_id) DO NOTHING;

  RETURN QUERY SELECT * FROM public.service_instances
  WHERE order_id = p_order_id ORDER BY created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.create_service_instances_for_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_service_instances_for_order(uuid) TO service_role;

-- Any event marked processed releases its lease, including legacy webhook update statements.
CREATE OR REPLACE FUNCTION public.release_processed_webhook_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.processed = true THEN
    NEW.processing_started_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billing_webhook_events_release_lease ON public.billing_webhook_events;
CREATE TRIGGER billing_webhook_events_release_lease
BEFORE UPDATE ON public.billing_webhook_events
FOR EACH ROW EXECUTE FUNCTION public.release_processed_webhook_event();
