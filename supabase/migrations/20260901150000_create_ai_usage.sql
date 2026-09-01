/* HS-015 AI usage and project tracking.
   AI provider costs and customer credit prices remain configuration data.
*/

CREATE TABLE IF NOT EXISTS ai_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'website' CHECK (kind IN ('website','app')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','ready','deployed','failed','archived')),
  provider text,
  model text,
  external_project_id text,
  deployment_url text,
  custom_domain text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_projects_user ON ai_projects(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES ai_projects(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('generation','edit','deployment','assistant')),
  provider text,
  model text,
  input_tokens integer NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens integer NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  total_tokens integer NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  provider_cost numeric(14,6) NOT NULL DEFAULT 0 CHECK (provider_cost >= 0),
  hostsuite_credits numeric(14,4) NOT NULL DEFAULT 0 CHECK (hostsuite_credits >= 0),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_project ON ai_usage_events(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_credit_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits numeric(14,4) NOT NULL CHECK (credits > 0),
  price numeric(14,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

ALTER TABLE ai_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_ai_projects" ON ai_projects;
CREATE POLICY "users_manage_own_ai_projects" ON ai_projects
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "users_read_own_ai_usage" ON ai_usage_events;
CREATE POLICY "users_read_own_ai_usage" ON ai_usage_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_write_ai_usage" ON ai_usage_events;
CREATE POLICY "admin_write_ai_usage" ON ai_usage_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users_read_active_ai_packs" ON ai_credit_packs;
CREATE POLICY "users_read_active_ai_packs" ON ai_credit_packs
  FOR SELECT TO authenticated
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_manage_ai_packs" ON ai_credit_packs;
CREATE POLICY "admin_manage_ai_packs" ON ai_credit_packs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
