-- HS-013 customer profile foundation.
-- This migration is committed for review only; it must not be applied without approval.

CREATE TABLE IF NOT EXISTS public.customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  company_name text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  marketing_opt_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_read_own_profile" ON public.customer_profiles;
CREATE POLICY "customers_read_own_profile"
  ON public.customer_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_update_own_profile" ON public.customer_profiles;
CREATE POLICY "customers_update_own_profile"
  ON public.customer_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_customer_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.customer_profiles (
    user_id, first_name, last_name, phone, company_name,
    marketing_opt_in, marketing_opt_in_at
  )
  VALUES (
    NEW.id,
    NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'phone'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'company_name'), ''),
    (lower(COALESCE(NEW.raw_user_meta_data ->> 'marketing_opt_in', 'false')) IN ('true', '1', 'yes', 'on')),
    CASE
      WHEN (lower(COALESCE(NEW.raw_user_meta_data ->> 'marketing_opt_in', 'false')) IN ('true', '1', 'yes', 'on'))
      THEN now()
      ELSE NULL
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_customer_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_customer_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer_profile();

-- Backfill accounts created before this migration. Metadata is optional.
INSERT INTO public.customer_profiles (
  user_id, first_name, last_name, phone, company_name,
  marketing_opt_in, marketing_opt_in_at
)
SELECT
  u.id,
  NULLIF(trim(u.raw_user_meta_data ->> 'first_name'), ''),
  NULLIF(trim(u.raw_user_meta_data ->> 'last_name'), ''),
  NULLIF(trim(u.raw_user_meta_data ->> 'phone'), ''),
  NULLIF(trim(u.raw_user_meta_data ->> 'company_name'), ''),
  (lower(COALESCE(u.raw_user_meta_data ->> 'marketing_opt_in', 'false')) IN ('true', '1', 'yes', 'on')),
  CASE
    WHEN (lower(COALESCE(u.raw_user_meta_data ->> 'marketing_opt_in', 'false')) IN ('true', '1', 'yes', 'on'))
    THEN u.created_at
    ELSE NULL
  END
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_customer_profiles_company_name
  ON public.customer_profiles (company_name)
  WHERE company_name IS NOT NULL;
