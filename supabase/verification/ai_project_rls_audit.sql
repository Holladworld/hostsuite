-- Read-only preflight/postflight for the AI project RLS change.
-- Run in the Supabase SQL Editor. This script does not modify schema or data.

-- 1) Confirm RLS is enabled on both AI tables.
select
  c.relname as table_name,
  c.relrowsecurity as row_level_security_enabled,
  c.relforcerowsecurity as row_level_security_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('ai_projects', 'ai_usage_events')
order by c.relname;

-- 2) Inspect every policy, including policies not represented in the checked-in
-- migration history. Run this before applying the migration and again after it.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('ai_projects', 'ai_usage_events')
order by tablename, policyname;

-- Expected after the migration:
-- ai_projects:
--   * SELECT for authenticated owners (or admins)
--   * no authenticated INSERT, UPDATE, or DELETE policy
-- ai_usage_events:
--   * SELECT for authenticated owners (or admins)
--   * INSERT restricted to admins
--
-- The API uses the service-role key for writes, which bypasses RLS. Keep that
-- key server-side only. Do not apply the migration until the preflight output
-- has been reviewed for additional manually-created permissive policies.
