-- HS: AI website projects are customer-readable but server-write-owned.
--
-- The website builder uses authenticated API routes that verify the bearer token,
-- resolve the user with Supabase Auth, and scope project operations by user_id.
-- Those routes use the server-side service role client for writes, which bypasses
-- RLS. Customers must not be able to alter workflow state or generated content
-- by calling the Supabase Data API directly.
--
-- Keep owner-scoped reads for the customer portal. Do not add authenticated
-- INSERT, UPDATE, or DELETE policies here; server-side APIs own those writes.

ALTER TABLE public.ai_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_ai_projects" ON public.ai_projects;
DROP POLICY IF EXISTS "users_read_own_ai_projects" ON public.ai_projects;

CREATE POLICY "users_read_own_ai_projects"
  ON public.ai_projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
