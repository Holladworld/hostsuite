CREATE TABLE IF NOT EXISTS ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN ('website_builder', 'assistant')),
  provider text,
  model text,
  units numeric(12,4) NOT NULL DEFAULT 1 CHECK (units > 0),
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_usage_events(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_request_id ON ai_usage_events(user_id, request_id) WHERE request_id IS NOT NULL;

ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_ai_usage" ON ai_usage_events;
CREATE POLICY "users_read_own_ai_usage" ON ai_usage_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION record_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_provider text,
  p_model text,
  p_units numeric,
  p_request_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_id uuid;
BEGIN
  INSERT INTO ai_usage_events(user_id, feature, provider, model, units, request_id, metadata)
  VALUES (p_user_id, p_feature, p_provider, p_model, p_units, p_request_id, COALESCE(p_metadata, '{}'::jsonb))
  ON CONFLICT (user_id, request_id) WHERE request_id IS NOT NULL DO NOTHING
  RETURNING id INTO usage_id;
  RETURN usage_id;
END;
$$;
