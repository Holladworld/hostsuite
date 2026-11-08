-- AI generation guardrails: per-user daily attempt cap, recoverable leases,
-- attempt-scoped finalization, and reliable project update timestamps.
ALTER TABLE public.ai_projects
  ADD COLUMN IF NOT EXISTS generation_attempt_id uuid,
  ADD COLUMN IF NOT EXISTS generation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_lease_expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.touch_ai_project_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_projects_updated_at ON public.ai_projects;
CREATE TRIGGER ai_projects_updated_at
  BEFORE UPDATE ON public.ai_projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_ai_project_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_generation_attempts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.ai_projects(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  provider text,
  model text,
  input_tokens integer NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens integer NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  total_tokens integer NOT NULL DEFAULT 0 CHECK (total_tokens >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_attempts_user_started
  ON public.ai_generation_attempts(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_attempts_project_status
  ON public.ai_generation_attempts(project_id, status);

ALTER TABLE public.ai_generation_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_generation_attempts FROM anon, authenticated;
GRANT ALL ON public.ai_generation_attempts TO service_role;
-- No client policies: this ledger is read/written only by trusted server functions.

-- Drop every legacy policy, including unexpectedly named permissive write policies.
DO $policy_cleanup$
DECLARE existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'ai_projects'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.ai_projects', existing_policy.policyname);
  END LOOP;
END;
$policy_cleanup$;

CREATE POLICY ai_projects_owner_read
  ON public.ai_projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.claim_ai_generation(
  p_user_id uuid,
  p_project_id uuid,
  p_attempt_id uuid,
  p_daily_limit integer,
  p_lease_seconds integer
)
RETURNS TABLE(allowed boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_count integer;
  v_previous_attempt uuid;
BEGIN
  IF p_user_id IS NULL OR p_attempt_id IS NULL OR p_daily_limit < 1
     OR p_lease_seconds < 60 OR p_lease_seconds > 3600 THEN
    RETURN QUERY SELECT false, 'invalid_claim_parameters'::text;
    RETURN;
  END IF;

  -- Serialize claims per user so concurrent requests cannot exceed the daily cap.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- Expire abandoned work before counting, including non-project requests.
  UPDATE public.ai_generation_attempts
     SET status = 'abandoned', completed_at = now()
   WHERE user_id = p_user_id AND status = 'running' AND lease_expires_at <= now();

  SELECT count(*)::integer
    INTO v_attempt_count
    FROM public.ai_generation_attempts
   WHERE user_id = p_user_id
     AND started_at >= date_trunc('day', now())
     AND status IN ('running', 'completed', 'failed', 'abandoned');

  IF v_attempt_count >= p_daily_limit THEN
    RETURN QUERY SELECT false, 'daily_limit_reached'::text;
    RETURN;
  END IF;

  IF p_project_id IS NOT NULL THEN
    SELECT generation_attempt_id
      INTO v_previous_attempt
      FROM public.ai_projects
     WHERE id = p_project_id
       AND user_id = p_user_id
       AND kind = 'website'
       AND (
         status IN ('draft', 'ready', 'failed')
         OR (status = 'generating' AND
             (generation_lease_expires_at IS NULL OR generation_lease_expires_at <= now()))
       )
     FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT false, 'project_unavailable'::text;
      RETURN;
    END IF;

    IF v_previous_attempt IS NOT NULL THEN
      UPDATE public.ai_generation_attempts
         SET status = 'abandoned', completed_at = now()
       WHERE id = v_previous_attempt AND status = 'running';
    END IF;

    UPDATE public.ai_projects
       SET status = 'generating',
           generation_attempt_id = p_attempt_id,
           generation_started_at = now(),
           generation_lease_expires_at = now() + make_interval(secs => p_lease_seconds)
     WHERE id = p_project_id AND user_id = p_user_id;
  END IF;

  INSERT INTO public.ai_generation_attempts (
    id, user_id, project_id, status, lease_expires_at
  ) VALUES (
    p_attempt_id, p_user_id, p_project_id, 'running',
    now() + make_interval(secs => p_lease_seconds)
  );

  RETURN QUERY SELECT true, 'claimed'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_ai_generation(
  p_attempt_id uuid,
  p_status text,
  p_provider text,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_total_tokens integer,
  p_project_metadata jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.ai_generation_attempts%ROWTYPE;
  v_updated integer;
BEGIN
  IF p_status NOT IN ('completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid AI generation final status';
  END IF;

  SELECT * INTO v_attempt
    FROM public.ai_generation_attempts
   WHERE id = p_attempt_id AND status = 'running'
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_attempt.project_id IS NOT NULL THEN
    IF p_status = 'completed' THEN
      UPDATE public.ai_projects
         SET status = 'ready',
             provider = p_provider,
             model = p_model,
             metadata = COALESCE(p_project_metadata, metadata),
             generation_attempt_id = NULL,
             generation_started_at = NULL,
             generation_lease_expires_at = NULL
       WHERE id = v_attempt.project_id
         AND generation_attempt_id = p_attempt_id
         AND status = 'generating';
    ELSE
      UPDATE public.ai_projects
         SET status = 'failed',
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{generation}',
               COALESCE(metadata->'generation', '{}'::jsonb) ||
                 jsonb_build_object('status', 'failed', 'failedAt', now(), 'attemptId', p_attempt_id),
               true
             ),
             generation_attempt_id = NULL,
             generation_started_at = NULL,
             generation_lease_expires_at = NULL
       WHERE id = v_attempt.project_id
         AND generation_attempt_id = p_attempt_id
         AND status = 'generating';
    END IF;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
      UPDATE public.ai_generation_attempts
         SET status = 'abandoned', completed_at = now()
       WHERE id = p_attempt_id AND status = 'running';
      RETURN false;
    END IF;
  END IF;

  UPDATE public.ai_generation_attempts
     SET status = p_status,
         completed_at = now(),
         provider = p_provider,
         model = p_model,
         input_tokens = GREATEST(COALESCE(p_input_tokens, 0), 0),
         output_tokens = GREATEST(COALESCE(p_output_tokens, 0), 0),
         total_tokens = GREATEST(COALESCE(p_total_tokens, 0), 0)
   WHERE id = p_attempt_id AND status = 'running';

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ai_generation(uuid, uuid, uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_ai_generation(uuid, text, text, text, integer, integer, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_generation(uuid, uuid, uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_ai_generation(uuid, text, text, text, integer, integer, integer, jsonb) TO service_role;
