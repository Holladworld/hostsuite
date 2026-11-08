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
