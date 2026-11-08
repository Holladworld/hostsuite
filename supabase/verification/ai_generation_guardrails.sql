-- Run after applying 20261108130000_harden_ai_generation.sql in the Supabase SQL editor.
-- Every boolean below should be true; unexpected project write policies should be zero.
SELECT
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.ai_projects'::regclass)
    AS ai_projects_rls_enabled,
  (SELECT count(*) = 0 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_projects'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
    AS no_client_project_write_policies,
  (SELECT count(*) = 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_projects'
      AND policyname = 'ai_projects_owner_read' AND cmd = 'SELECT')
    AS owner_read_policy_present,
  (SELECT count(*) = 1 FROM pg_trigger
    WHERE tgrelid = 'public.ai_projects'::regclass
      AND tgname = 'ai_projects_updated_at' AND NOT tgisinternal)
    AS updated_at_trigger_present,
  to_regclass('public.ai_generation_attempts') IS NOT NULL
    AS generation_attempt_ledger_present,
  has_function_privilege(
    'service_role',
    'public.claim_ai_generation(uuid,uuid,uuid,integer,integer)',
    'EXECUTE'
  ) AS service_role_can_claim,
  NOT has_function_privilege(
    'authenticated',
    'public.claim_ai_generation(uuid,uuid,uuid,integer,integer)',
    'EXECUTE'
  ) AS authenticated_cannot_claim,
  has_function_privilege(
    'service_role',
    'public.finish_ai_generation(uuid,text,text,text,integer,integer,integer,jsonb)',
    'EXECUTE'
  ) AS service_role_can_finalize,
  NOT has_function_privilege(
    'authenticated',
    'public.finish_ai_generation(uuid,text,text,text,integer,integer,integer,jsonb)',
    'EXECUTE'
  ) AS authenticated_cannot_finalize;
