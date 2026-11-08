-- Immutable, revisioned quotes for one-off customer support work.
-- No recurring subscription is created by this flow.

CREATE TABLE IF NOT EXISTS public.ticket_quote_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  revision integer NOT NULL CHECK (revision > 0),
  agreed_scope text NOT NULL CHECK (length(trim(agreed_scope)) > 0),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  status text NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment','superseded','paid','cancelled')),
  change_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, revision)
);

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS current_quote_revision_id uuid
    REFERENCES public.ticket_quote_revisions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_quote_revisions_ticket
  ON public.ticket_quote_revisions(ticket_id, revision DESC);

ALTER TABLE public.ticket_quote_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ticket_quote_revisions FROM anon, authenticated;
GRANT SELECT ON TABLE public.ticket_quote_revisions TO authenticated;
DROP POLICY IF EXISTS "customers_read_own_ticket_quote_revisions" ON public.ticket_quote_revisions;
CREATE POLICY "customers_read_own_ticket_quote_revisions"
  ON public.ticket_quote_revisions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.user_id = auth.uid()
  ) OR public.is_admin());

-- Quote terms are immutable. Only the workflow status may move forward.
CREATE OR REPLACE FUNCTION public.prevent_ticket_quote_revision_edits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_id IS DISTINCT FROM OLD.ticket_id
    OR NEW.revision IS DISTINCT FROM OLD.revision
    OR NEW.agreed_scope IS DISTINCT FROM OLD.agreed_scope
    OR NEW.amount IS DISTINCT FROM OLD.amount
    OR NEW.currency IS DISTINCT FROM OLD.currency
    OR NEW.change_reason IS DISTINCT FROM OLD.change_reason
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'QUOTE_REVISION_IS_IMMUTABLE';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
    OLD.status = 'awaiting_payment' AND NEW.status IN ('superseded','paid','cancelled')
  ) THEN
    RAISE EXCEPTION 'INVALID_QUOTE_STATUS_TRANSITION';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ticket_quote_revision_immutable ON public.ticket_quote_revisions;
CREATE TRIGGER ticket_quote_revision_immutable
  BEFORE UPDATE ON public.ticket_quote_revisions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ticket_quote_revision_edits();

-- Admin API invokes this function with service_role after authenticating staff.
CREATE OR REPLACE FUNCTION public.create_ticket_quote_revision(
  p_ticket_id uuid,
  p_scope text,
  p_amount numeric,
  p_currency text DEFAULT 'NGN',
  p_reason text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_row public.support_tickets%ROWTYPE;
  next_revision integer;
  revision_id uuid;
BEGIN
  IF p_scope IS NULL OR length(trim(p_scope)) = 0 OR length(p_scope) > 10000 THEN
    RAISE EXCEPTION 'INVALID_QUOTE_SCOPE';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 999999999999.99 THEN
    RAISE EXCEPTION 'INVALID_QUOTE_AMOUNT';
  END IF;
  IF COALESCE(p_currency, 'NGN') <> 'NGN' THEN
    RAISE EXCEPTION 'UNSUPPORTED_QUOTE_CURRENCY';
  END IF;

  SELECT * INTO ticket_row FROM public.support_tickets
  WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TICKET_NOT_FOUND'; END IF;
  IF ticket_row.quote_status = 'paid' THEN
    RAISE EXCEPTION 'PAID_QUOTE_LOCKED';
  END IF;

  SELECT COALESCE(MAX(revision), 0) + 1 INTO next_revision
  FROM public.ticket_quote_revisions WHERE ticket_id = p_ticket_id;

  UPDATE public.ticket_quote_revisions
  SET status = 'superseded'
  WHERE ticket_id = p_ticket_id AND status = 'awaiting_payment';

  INSERT INTO public.ticket_quote_revisions(
    ticket_id, revision, agreed_scope, amount, currency, status, change_reason, created_by
  ) VALUES (
    p_ticket_id, next_revision, trim(p_scope), round(p_amount, 2), 'NGN',
    'awaiting_payment', NULLIF(trim(p_reason), ''), p_created_by
  ) RETURNING id INTO revision_id;

  UPDATE public.support_tickets
  SET current_quote_revision_id = revision_id,
      agreed_scope = trim(p_scope),
      quoted_amount = round(p_amount, 2),
      quote_currency = 'NGN',
      quote_status = 'awaiting_payment',
      billing_order_id = NULL
  WHERE id = p_ticket_id;

  RETURN revision_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_ticket_quote_revision(uuid,text,numeric,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_ticket_quote_revision(uuid,text,numeric,text,text,uuid) TO service_role;

-- Convert the diagnostic and create its initial quote in one transaction.
-- This prevents a ticket being left without its agreed quote if quote creation fails.
CREATE OR REPLACE FUNCTION public.convert_diagnostic_lead_to_ticket_with_quote(
  p_lead_id uuid,
  p_user_id uuid,
  p_agreed_scope text,
  p_quoted_amount numeric DEFAULT NULL,
  p_quote_currency text DEFAULT 'NGN',
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  ticket_id uuid;
BEGIN
  ticket_id := public.convert_diagnostic_lead_to_ticket(
    p_lead_id, p_user_id, p_agreed_scope, p_quoted_amount, p_quote_currency
  );

  IF p_quoted_amount IS NOT NULL AND p_quoted_amount > 0 THEN
    PERFORM public.create_ticket_quote_revision(
      ticket_id,
      p_agreed_scope,
      p_quoted_amount,
      p_quote_currency,
      'Initial quote agreed during diagnostic conversion',
      p_created_by
    );
  END IF;

  RETURN ticket_id;
END;
$;

REVOKE ALL ON FUNCTION public.convert_diagnostic_lead_to_ticket_with_quote(uuid,uuid,text,numeric,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_diagnostic_lead_to_ticket_with_quote(uuid,uuid,text,numeric,text,uuid) TO service_role;

-- This is the only path by which a ticket quote can be marked paid.
-- It locks the ticket and quote revision and compares the immutable order snapshot.
CREATE OR REPLACE FUNCTION public.settle_ticket_quote_payment(p_order_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.billing_orders%ROWTYPE;
  revision_id uuid;
  revision_row public.ticket_quote_revisions%ROWTYPE;
  ticket_row public.support_tickets%ROWTYPE;
  invoice_row record;
BEGIN
  SELECT * INTO order_row FROM public.billing_orders
  WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  revision_id := NULLIF(order_row.metadata->>'ticket_quote_revision_id', '')::uuid;
  IF revision_id IS NULL OR order_row.metadata->>'source' <> 'ticket_quote' THEN
    RAISE EXCEPTION 'NOT_A_TICKET_QUOTE_ORDER';
  END IF;

  -- Lock the ticket before the revision, matching quote creation's lock order.
  -- This avoids a ticket/revision lock inversion when an admin revises a quote
  -- while a payment webhook is settling an older checkout.
  SELECT * INTO revision_row FROM public.ticket_quote_revisions
  WHERE id = revision_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUOTE_REVISION_NOT_FOUND'; END IF;
  SELECT * INTO ticket_row FROM public.support_tickets
  WHERE id = revision_row.ticket_id FOR UPDATE;
  SELECT * INTO revision_row FROM public.ticket_quote_revisions
  WHERE id = revision_id FOR UPDATE;

  IF order_row.user_id <> ticket_row.user_id
    OR order_row.total <> revision_row.amount
    OR order_row.currency <> revision_row.currency THEN
    RAISE EXCEPTION 'ORDER_QUOTE_MISMATCH';
  END IF;

  IF revision_row.status = 'paid' AND order_row.status = 'paid' THEN
    RETURN 'already_paid';
  END IF;

  IF ticket_row.current_quote_revision_id IS DISTINCT FROM revision_id
    OR revision_row.status <> 'awaiting_payment'
    OR ticket_row.quote_status <> 'awaiting_payment' THEN
    -- The gateway has already confirmed receipt. Record the money as received
    -- while keeping the superseded quote/ticket unsettled for human reconciliation.
    UPDATE public.billing_orders
    SET status = 'paid',
        paid_at = COALESCE(paid_at, now()),
        metadata = metadata || jsonb_build_object(
          'needs_manual_reconciliation', true,
          'reconciliation_reason', 'Payment arrived for a superseded quote revision; verify and refund or reallocate',
          'reconciliation_marked_at', now()
        )
    WHERE id = p_order_id;
    UPDATE public.billing_invoices
    SET status = 'paid', paid_at = COALESCE(paid_at, now())
    WHERE order_id = p_order_id;
    RETURN 'stale_payment';
  END IF;

  IF order_row.status <> 'pending' THEN
    UPDATE public.billing_orders
    SET metadata = metadata || jsonb_build_object(
      'needs_manual_reconciliation', true,
      'reconciliation_reason', 'Gateway confirmed payment but the billing order was not pending',
      'reconciliation_marked_at', now()
    )
    WHERE id = p_order_id;
    RETURN 'order_not_payable';
  END IF;

  UPDATE public.billing_orders SET status = 'paid', paid_at = now()
  WHERE id = p_order_id AND status = 'pending';
  UPDATE public.billing_invoices SET status = 'paid', paid_at = now()
  WHERE order_id = p_order_id;
  UPDATE public.ticket_quote_revisions SET status = 'paid'
  WHERE id = revision_id AND status = 'awaiting_payment';
  UPDATE public.support_tickets
  SET quote_status = 'paid',
      billing_order_id = p_order_id,
      status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END
  WHERE id = ticket_row.id AND current_quote_revision_id = revision_id;

  RETURN 'paid';
END;
$$;

REVOKE ALL ON FUNCTION public.settle_ticket_quote_payment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_ticket_quote_payment(uuid) TO service_role;

-- A quote revision has at most one billing order. Repeated checkout requests reuse it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_orders_ticket_quote_revision
  ON public.billing_orders ((metadata->>'ticket_quote_revision_id'))
  WHERE metadata->>'source' = 'ticket_quote';

-- Atomically create the order, item and invoice for a specific current quote.
-- Locking the ticket serializes simultaneous checkout attempts for one quote.
CREATE OR REPLACE FUNCTION public.create_ticket_quote_order(
  p_ticket_id uuid,
  p_user_id uuid,
  p_quote_revision_id uuid,
  p_provider text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_row public.support_tickets%ROWTYPE;
  quote_row public.ticket_quote_revisions%ROWTYPE;
  existing_order_id uuid;
  new_order_id uuid;
  order_reference text;
  invoice_number text;
BEGIN
  IF p_provider NOT IN ('paystack','flutterwave') THEN
    RAISE EXCEPTION 'UNSUPPORTED_PAYMENT_PROVIDER';
  END IF;

  SELECT * INTO ticket_row FROM public.support_tickets
  WHERE id = p_ticket_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TICKET_NOT_FOUND'; END IF;
  IF ticket_row.current_quote_revision_id IS DISTINCT FROM p_quote_revision_id
    OR ticket_row.quote_status <> 'awaiting_payment' THEN
    RAISE EXCEPTION 'QUOTE_NOT_CURRENT';
  END IF;

  SELECT * INTO quote_row FROM public.ticket_quote_revisions
  WHERE id = p_quote_revision_id AND ticket_id = p_ticket_id FOR UPDATE;
  IF NOT FOUND OR quote_row.status <> 'awaiting_payment' THEN
    RAISE EXCEPTION 'QUOTE_NOT_PAYABLE';
  END IF;

  SELECT id INTO existing_order_id FROM public.billing_orders
  WHERE user_id = p_user_id
    AND metadata->>'source' = 'ticket_quote'
    AND metadata->>'ticket_quote_revision_id' = p_quote_revision_id::text;
  IF existing_order_id IS NOT NULL THEN
    RETURN existing_order_id;
  END IF;

  new_order_id := gen_random_uuid();
  order_reference := 'HS-TICKET-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));
  invoice_number := 'HS-' || extract(year FROM now())::integer::text || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  INSERT INTO public.billing_orders(
    id, user_id, status, currency, subtotal, total, provider, provider_reference,
    idempotency_key, metadata
  ) VALUES (
    new_order_id, p_user_id, 'pending', quote_row.currency, quote_row.amount, quote_row.amount,
    p_provider, order_reference, gen_random_uuid()::text,
    jsonb_build_object(
      'source','ticket_quote',
      'ticket_id',p_ticket_id,
      'ticket_quote_revision_id',p_quote_revision_id
    )
  );

  INSERT INTO public.billing_order_items(
    order_id, product_name, quantity, unit_price, total, metadata
  ) VALUES (
    new_order_id,
    'HostSuite support ticket ' || substr(p_ticket_id::text, 1, 8) || ' — quote ' || substr(p_quote_revision_id::text, 1, 8),
    1, quote_row.amount, quote_row.amount,
    jsonb_build_object('source','ticket_quote','ticket_id',p_ticket_id,'ticket_quote_revision_id',p_quote_revision_id)
  );

  INSERT INTO public.billing_invoices(
    user_id, order_id, invoice_number, status, currency, subtotal, total
  ) VALUES (
    p_user_id, new_order_id, invoice_number, 'open', quote_row.currency, quote_row.amount, quote_row.amount
  );

  UPDATE public.support_tickets SET billing_order_id = new_order_id
  WHERE id = p_ticket_id AND current_quote_revision_id = p_quote_revision_id;

  RETURN new_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_ticket_quote_order(uuid,uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_ticket_quote_order(uuid,uuid,uuid,text) TO service_role;

-- Browser-created tickets and public leads must not be able to forge staff-owned
-- quote/payment state, lead conversion state, resolution state or internal notes.
CREATE OR REPLACE FUNCTION public.protect_customer_ticket_staff_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.lead_id := NULL;
    NEW.agreed_scope := NULL;
    NEW.quoted_amount := NULL;
    NEW.quote_currency := 'NGN';
    NEW.quote_status := 'not_quoted';
    NEW.billing_order_id := NULL;
    NEW.admin_notes := NULL;
    NEW.current_quote_revision_id := NULL;
    NEW.status := 'open';
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_customer_ticket_staff_fields ON public.support_tickets;
CREATE TRIGGER protect_customer_ticket_staff_fields
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.protect_customer_ticket_staff_fields();

CREATE OR REPLACE FUNCTION public.protect_public_lead_conversion_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    NEW.status := 'new';
    NEW.linked_user_id := NULL;
    NEW.converted_at := NULL;
  ELSIF NOT public.is_admin() THEN
    NEW.status := 'new';
    NEW.linked_user_id := NULL;
    NEW.converted_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_public_lead_conversion_fields ON public.leads;
CREATE TRIGGER protect_public_lead_conversion_fields
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.protect_public_lead_conversion_fields();

