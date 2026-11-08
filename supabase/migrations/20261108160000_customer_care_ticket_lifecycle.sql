-- HostSuite customer care lifecycle foundation.
-- Extend the existing lead and ticket records; do not replace the diagnostic/WhatsApp flow.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agreed_scope text,
  ADD COLUMN IF NOT EXISTS quoted_amount numeric(14,2) CHECK (quoted_amount IS NULL OR quoted_amount >= 0),
  ADD COLUMN IF NOT EXISTS quote_currency text NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS quote_status text NOT NULL DEFAULT 'not_quoted'
    CHECK (quote_status IN ('not_quoted','awaiting_payment','paid','waived','declined')),
  ADD COLUMN IF NOT EXISTS billing_order_id uuid REFERENCES public.billing_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- A diagnostic lead can become one customer ticket. A later diagnostic is a new lead
-- and therefore creates a separate ticket, preserving the customer's full history.
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_one_ticket_per_lead
  ON public.support_tickets(lead_id)
  WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_linked_user
  ON public.leads(linked_user_id, created_at DESC)
  WHERE linked_user_id IS NOT NULL;

-- Diagnostic submissions remain public, but lead records must never be publicly readable.
DROP POLICY IF EXISTS "anon_select_leads" ON public.leads;
DROP POLICY IF EXISTS "auth_update_leads" ON public.leads;
DROP POLICY IF EXISTS "auth_delete_leads" ON public.leads;
DROP POLICY IF EXISTS "admins_manage_all_leads" ON public.leads;
CREATE POLICY "admins_manage_all_leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Customers can create and read their own tickets. Staff can manage all tickets.
-- Customers cannot edit status, staff notes, quotes, or delete the audit history.
DROP POLICY IF EXISTS "update_own_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "delete_own_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "admins_manage_all_support_tickets" ON public.support_tickets;
CREATE POLICY "admins_manage_all_support_tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- Convert a diagnostic and create its customer ticket atomically. The API resolves
-- the customer identity first; only the server-side service role may call this function.
CREATE OR REPLACE FUNCTION public.convert_diagnostic_lead_to_ticket(
  p_lead_id uuid,
  p_user_id uuid,
  p_agreed_scope text,
  p_quoted_amount numeric DEFAULT NULL,
  p_quote_currency text DEFAULT 'NGN'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_row public.leads%ROWTYPE;
  ticket_id uuid;
  ticket_subject text;
  ticket_details text;
BEGIN
  IF p_user_id IS NULL OR p_agreed_scope IS NULL OR length(trim(p_agreed_scope)) = 0 THEN
    RAISE EXCEPTION 'INVALID_CONVERSION_INPUT';
  END IF;
  IF p_quoted_amount IS NOT NULL AND p_quoted_amount < 0 THEN
    RAISE EXCEPTION 'INVALID_QUOTED_AMOUNT';
  END IF;

  SELECT * INTO lead_row
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LEAD_NOT_FOUND';
  END IF;

  IF EXISTS (SELECT 1 FROM public.support_tickets WHERE lead_id = p_lead_id) THEN
    RAISE EXCEPTION 'LEAD_ALREADY_CONVERTED';
  END IF;

  ticket_subject := CASE
    WHEN COALESCE(array_length(lead_row.pain_points, 1), 0) > 0
      THEN 'Diagnostic: ' || array_to_string(lead_row.pain_points[1:2], ', ')
    ELSE 'Diagnostic support request'
  END;

  ticket_details := concat_ws(E'\n\n',
    CASE WHEN NULLIF(lead_row.description, '') IS NOT NULL
      THEN 'Customer description:' || E'\n' || lead_row.description END,
    CASE WHEN lead_row.estimated_cost_min IS NOT NULL AND lead_row.estimated_cost_max IS NOT NULL
      THEN 'Initial estimate: ' || lead_row.estimated_cost_min::text || ' – ' || lead_row.estimated_cost_max::text || ' NGN' END,
    'Agreed scope:' || E'\n' || trim(p_agreed_scope),
    CASE WHEN NULLIF(lead_row.whatsapp, '') IS NOT NULL
      THEN 'WhatsApp: ' || lead_row.whatsapp END
  );

  INSERT INTO public.support_tickets (
    user_id, lead_id, domain, request_type, subject, details, priority, status,
    agreed_scope, quoted_amount, quote_currency, quote_status
  ) VALUES (
    p_user_id, p_lead_id, lead_row.domain_url, 'other', ticket_subject, ticket_details,
    'normal', 'open', trim(p_agreed_scope), p_quoted_amount,
    COALESCE(NULLIF(p_quote_currency, ''), 'NGN'),
    CASE WHEN p_quoted_amount IS NULL THEN 'not_quoted'
         WHEN p_quoted_amount = 0 THEN 'waived'
         ELSE 'awaiting_payment' END
  )
  RETURNING id INTO ticket_id;

  UPDATE public.leads
  SET linked_user_id = p_user_id, converted_at = now(), status = 'won'
  WHERE id = p_lead_id;

  RETURN ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_diagnostic_lead_to_ticket(uuid, uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_diagnostic_lead_to_ticket(uuid, uuid, text, numeric, text) TO service_role;
