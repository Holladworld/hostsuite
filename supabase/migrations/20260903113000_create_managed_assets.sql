-- HS: Customers can bring services they already have with another provider.
-- This is intentionally separate from service_instances: HostSuite must never
-- represent an external service as something it provisioned itself.

CREATE TABLE IF NOT EXISTS managed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('domain','hosting','email','website','monitoring','support','managed_service','ai_builder','other')),
  name text NOT NULL,
  identifier text NOT NULL,
  provider_name text,
  management_mode text NOT NULL DEFAULT 'hostsuite' CHECK (management_mode IN ('self','hostsuite','help')),
  status text NOT NULL DEFAULT 'pending_setup' CHECK (status IN ('pending_setup','active','attention_needed','disconnected','archived')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_managed_assets_user ON managed_assets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_managed_assets_type ON managed_assets(user_id, service_type, status);

ALTER TABLE managed_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_managed_assets" ON managed_assets;
CREATE POLICY "users_read_own_managed_assets"
  ON managed_assets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Writes are server-owned so the API can validate the authenticated user and
-- keep provider/account metadata under controlled server-side handling.

CREATE OR REPLACE FUNCTION touch_managed_asset_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS managed_assets_updated_at ON managed_assets;
CREATE TRIGGER managed_assets_updated_at
  BEFORE UPDATE ON managed_assets
  FOR EACH ROW EXECUTE FUNCTION touch_managed_asset_updated_at();
