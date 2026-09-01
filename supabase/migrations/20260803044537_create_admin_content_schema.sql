/*
# HostSuite — Admin Operations, Content, and Knowledge Schema

## Overview
Expands the HostSuite database to support a full Master Operations Admin Suite,
public Knowledge Center, and Blog publishing system. Adds four new tables
(clients, blogs, knowledge_base, site_settings) and augments the existing
support_tickets table with an admin_notes column for staff workflow.

## New Tables

### 1. clients
Tracks authenticated client profiles linked to Supabase auth.users.
- id              uuid PK, references auth.users(id) ON DELETE CASCADE
- created_at      timestamptz default now()
- company_name    text
- corporate_email text
- whatsapp_number text
- subscription_tier text default 'starter_ops'
  ('starter_ops' | 'managed_growth' | 'enterprise')

### 2. blogs
Manages published technical articles and case studies for the public blog.
- id              uuid PK
- created_at      timestamptz default now()
- title           text NOT NULL
- slug            text NOT NULL UNIQUE
- excerpt         text
- content         text  (markdown / rich text)
- cover_image_url text
- tags            text[] default '{}'
- published       boolean default false
- published_at    timestamptz

### 3. knowledge_base
Manages public documentation guides and developer FAQs.
- id              uuid PK
- created_at      timestamptz default now()
- title           text NOT NULL
- slug            text NOT NULL UNIQUE
- category        text NOT NULL
  ('Email & Deliverability' | 'Access & Recovery' | 'Uptime & Performance' | 'Billing & SLAs')
- excerpt         text
- content         text
- views           integer default 0
- published       boolean default false

### 4. site_settings
Key-value JSONB storage for dynamic homepage content, banners, and pricing.
- key             text PK
- value           jsonb NOT NULL
- updated_at      timestamptz default now()

## Modified Tables

### support_tickets (augmented — non-destructive)
- Added column admin_notes text (nullable) for internal staff notes.
- Added column ticket_type text default 'other' for canonical request
  categorization (distinct from request_type which stays for backward
  compatibility with the client portal).

## Security (RLS)

### clients (owner-scoped + admin)
- RLS enabled. Clients can SELECT/UPDATE their own profile row (id = auth.uid()).
- Admin (vobels.co@gmail.com) has full CRUD on all rows.
- INSERT is admin-only (profiles are auto-created via trigger or admin action).

### blogs (public read, admin write)
- RLS enabled. Anyone (anon + authenticated) can SELECT published articles.
- Only admin can INSERT/UPDATE/DELETE.

### knowledge_base (public read, admin write)
- RLS enabled. Anyone can SELECT published articles.
- Incrementing views uses a SECURITY DEFINER function to bypass RLS safely.
- Only admin can INSERT/UPDATE/DELETE.

### site_settings (public read, admin write)
- RLS enabled. Anyone can SELECT (homepage needs to read settings).
- Only admin can INSERT/UPDATE/DELETE.

### support_tickets (existing owner-scoped policies preserved)
- Existing owner-scoped CRUD policies remain intact.
- Admin gets additional SELECT/UPDATE policies to manage all tickets.

## Admin Detection
Admin is identified by email match: auth.jwt() ->> 'email' = 'vobels.co@gmail.com'
This uses the JWT email claim which is set at authentication time and is not
user-editable (unlike raw_user_meta_data).

## Helper Functions

### is_admin()
Returns true if the current authenticated user's email is vobels.co@gmail.com.
Used in RLS policies for clean, reusable admin checks.

### increment_kb_views(slug text)
SECURITY DEFINER function that increments the view count on a knowledge base
article. Allows anonymous users to trigger view increments without needing
UPDATE access to the table.

## Important Notes
1. Email confirmation stays OFF — clients sign in immediately.
2. No destructive operations on existing tables. The support_tickets ALTER
   only adds nullable columns (data-safe).
3. Re-runnable: uses IF NOT EXISTS and drops policies before recreating.
4. The existing leads, domains, and support_tickets tables and their policies
   are NOT modified — only augmented.
*/

-- ============================================================
-- Helper: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() ->> 'email') = 'vobels.co@gmail.com',
    false
  );
$$;

-- ============================================================
-- clients
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  company_name text,
  corporate_email text,
  whatsapp_number text,
  subscription_tier text NOT NULL DEFAULT 'starter_ops'
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_clients" ON clients;
CREATE POLICY "select_own_or_admin_clients" ON clients FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_or_admin_clients" ON clients;
CREATE POLICY "update_own_or_admin_clients" ON clients FOR UPDATE
  TO authenticated USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "insert_admin_clients" ON clients;
CREATE POLICY "insert_admin_clients" ON clients FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_admin_clients" ON clients;
CREATE POLICY "delete_admin_clients" ON clients FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- blogs
-- ============================================================
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image_url text,
  tags text[] DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz
);

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_blogs" ON blogs;
CREATE POLICY "public_select_blogs" ON blogs FOR SELECT
  TO anon, authenticated USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_blogs" ON blogs;
CREATE POLICY "admin_insert_blogs" ON blogs FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_blogs" ON blogs;
CREATE POLICY "admin_update_blogs" ON blogs FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_blogs" ON blogs;
CREATE POLICY "admin_delete_blogs" ON blogs FOR DELETE
  TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs (published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs (slug);

-- ============================================================
-- knowledge_base
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  excerpt text,
  content text,
  views integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false
);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_kb" ON knowledge_base;
CREATE POLICY "public_select_kb" ON knowledge_base FOR SELECT
  TO anon, authenticated USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_kb" ON knowledge_base;
CREATE POLICY "admin_insert_kb" ON knowledge_base FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_kb" ON knowledge_base;
CREATE POLICY "admin_update_kb" ON knowledge_base FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_kb" ON knowledge_base;
CREATE POLICY "admin_delete_kb" ON knowledge_base FOR DELETE
  TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_kb_published ON knowledge_base (published, category);
CREATE INDEX IF NOT EXISTS idx_kb_slug ON knowledge_base (slug);

-- Helper: increment_kb_views (SECURITY DEFINER so anon can increment)
CREATE OR REPLACE FUNCTION public.increment_kb_views(slug_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE knowledge_base
  SET views = views + 1
  WHERE slug = slug_text AND published = true;
END;
$$;

-- ============================================================
-- site_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_settings" ON site_settings;
CREATE POLICY "public_select_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_upsert_settings" ON site_settings;
CREATE POLICY "admin_upsert_settings" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_settings" ON site_settings;
CREATE POLICY "admin_update_settings" ON site_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_settings" ON site_settings;
CREATE POLICY "admin_delete_settings" ON site_settings FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- support_tickets augmentation (non-destructive)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN admin_notes text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'ticket_type'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN ticket_type text NOT NULL DEFAULT 'other';
  END IF;
END $$;

-- Admin policies for support_tickets (in addition to existing owner-scoped ones)
DROP POLICY IF EXISTS "admin_select_tickets" ON support_tickets;
CREATE POLICY "admin_select_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_tickets" ON support_tickets;
CREATE POLICY "admin_update_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin policies for leads (in addition to existing ones)
-- Existing anon_select_leads already allows authenticated SELECT.
-- Add admin update/delete (existing auth_update_leads/auth_delete_leads
-- already allow authenticated users, so admin is covered).

-- Admin policies for domains (admin can see all domains)
DROP POLICY IF EXISTS "admin_select_domains" ON domains;
CREATE POLICY "admin_select_domains" ON domains FOR SELECT
  TO authenticated USING (public.is_admin());

-- ============================================================
-- Seed default site_settings
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('hero', '{"headline":"Your Developer Disappeared. Your Server Is Down. We Fix Both.","subheadline":"HostSuite is your fractional CTO and web operations team. We manage hosting, fix email deliverability, recover lost access, and build custom backend systems — so you can run your business.","hotlineText":"Emergency Infrastructure Hotline","whatsappDisplay":"+234 814 224 3764"}'::jsonb),
  ('pricing', '{"starter_ops_monthly":5000,"starter_ops_annual":50000,"managed_growth_monthly":12000,"managed_growth_annual":120000}'::jsonb)
ON CONFLICT (key) DO NOTHING;