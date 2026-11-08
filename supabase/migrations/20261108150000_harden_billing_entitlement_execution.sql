-- Restrict SECURITY DEFINER billing entitlement mutation to trusted server code.
-- Payment webhooks call this RPC only after independently verifying the provider transaction.
REVOKE ALL ON FUNCTION public.grant_billing_order_value(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_billing_order_value(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.grant_billing_order_value(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.grant_billing_order_value(uuid) TO service_role;

-- These two helpers are intentionally callable by the public/authenticated roles:
-- is_admin() is used by RLS policies; increment_kb_views() only increments the
-- counter for an already-published knowledge-base article.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.increment_kb_views(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_kb_views(text) TO anon, authenticated, service_role;
