-- HS-028 Admin Operations Center
-- Admins need visibility into real operational records. Customer ownership
-- remains the default; this adds a narrow admin read/write surface using
-- the existing public.is_admin() helper.

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_manage_all_domains" ON public.domains;
CREATE POLICY "admins_manage_all_domains" ON public.domains
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.service_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_manage_all_service_instances" ON public.service_instances;
CREATE POLICY "admins_manage_all_service_instances" ON public.service_instances
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.provisioning_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_read_provisioning_attempts" ON public.provisioning_attempts;
CREATE POLICY "admins_read_provisioning_attempts" ON public.provisioning_attempts
  FOR SELECT TO authenticated
  USING (public.is_admin());

ALTER TABLE public.billing_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_manage_all_billing_orders" ON public.billing_orders;
CREATE POLICY "admins_manage_all_billing_orders" ON public.billing_orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.billing_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_manage_all_billing_order_items" ON public.billing_order_items;
CREATE POLICY "admins_manage_all_billing_order_items" ON public.billing_order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_manage_all_billing_invoices" ON public.billing_invoices;
CREATE POLICY "admins_manage_all_billing_invoices" ON public.billing_invoices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_manage_all_billing_subscriptions" ON public.billing_subscriptions;
CREATE POLICY "admins_manage_all_billing_subscriptions" ON public.billing_subscriptions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.billing_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_read_all_billing_usage" ON public.billing_usage;
CREATE POLICY "admins_read_all_billing_usage" ON public.billing_usage
  FOR SELECT TO authenticated
  USING (public.is_admin());

ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_read_webhook_events" ON public.billing_webhook_events;
CREATE POLICY "admins_read_webhook_events" ON public.billing_webhook_events
  FOR SELECT TO authenticated
  USING (public.is_admin());
