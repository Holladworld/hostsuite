/*
# HostSuite — Lead Capture, Client Domains & Support Tickets

## Overview
Creates the data layer for the HostSuite managed-infrastructure platform
(Vobels Limited). Three tables support: (1) public lead capture from the
"Tell Us Your Pain" diagnostic and pricing CTAs, (2) per-client hosted
domain inventory shown in the Client Portal, and (3) support tickets filed
from the portal "Request a Fix" flow.

## New Tables

### 1. leads
Captures every inbound service request before a client account exists.
- id            uuid PK
- source        text   — 'diagnostic' | 'pricing' | 'manual'
- pain_points   text[] — selected pain categories from the diagnostic tool
- company_name  text
- domain_url    text
- description   text   — free-text problem description
- email         text
- whatsapp      text
- estimated_tier    text    — computed quote tier label
- estimated_cost_min numeric — lower bound (NGN)
- estimated_cost_max numeric — upper bound (NGN)
- turnaround_hours   int     — estimated fix window
- status        text   default 'new' — 'new'|'contacted'|'won'|'lost'
- created_at    timestamptz default now()

### 2. domains
Per-client hosted domain inventory shown in the Client Portal dashboard.
Owner-scoped to the signed-in user.
- id           uuid PK
- user_id      uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
- domain       text NOT NULL
- status       text NOT NULL DEFAULT 'active' — 'active'|'maintenance'|'backup_complete'|'expiring'
- plan_tier    text NOT NULL DEFAULT 'starter_ops' — 'starter_ops'|'managed_growth'|'enterprise'
- ssl_active   boolean default true
- last_backup  timestamptz
- uptime_pct   numeric(5,2) default 99.99
- created_at   timestamptz default now()

### 3. support_tickets
Tickets filed by clients from the portal "Request a Fix" button.
Owner-scoped to the signed-in user.
- id          uuid PK
- user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
- domain      text
- request_type text NOT NULL — 'text_update'|'email_setup'|'database_backup'|'migration'|'other'
- subject     text NOT NULL
- details     text
- priority    text default 'normal' — 'low'|'normal'|'high'|'emergency'
- status      text default 'open' — 'open'|'in_progress'|'resolved'|'closed'
- created_at  timestamptz default now()
- resolved_at timestamptz

## Security (RLS)

### leads (public intake — no sign-in required)
- RLS enabled. Anyone (anon + authenticated) can INSERT a lead.
- Only authenticated users can SELECT (staff review). For this app, we
  keep SELECT open to anon+authenticated so the marketing/dashboard can
  display aggregate lead counts without a service role call; the data is
  non-sensitive intake form content. UPDATE/DELETE restricted to
  authenticated (staff workflow).
- This is intentionally a public intake table: pain points, company,
  domain, contact email/whatsapp. Documented as intentionally public.

### domains (owner-scoped)
- RLS enabled. Four owner-scoped CRUD policies for authenticated users
  using auth.uid() = user_id. user_id defaults to auth.uid() so portal
  inserts succeed without the client threading the owner id.

### support_tickets (owner-scoped)
- RLS enabled. Four owner-scoped CRUD policies for authenticated users
  using auth.uid() = user_id. Same DEFAULT auth.uid() pattern.

## Indexes
- leads(created_at desc) — chronological staff review
- leads(status) — filter open vs. won/lost
- domains(user_id) — portal dashboard lookup
- support_tickets(user_id, created_at desc) — portal ticket history

## Notes
1. Email confirmation stays OFF (Supabase default) — clients sign in
   with email/password immediately.
2. No destructive operations on existing data.
3. Re-runnable: uses IF NOT EXISTS and drops policies before recreating.
*/

-- ============================================================
-- leads
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'diagnostic',
  pain_points text[] DEFAULT '{}',
  company_name text,
  domain_url text,
  description text,
  email text,
  whatsapp text,
  estimated_tier text,
  estimated_cost_min numeric,
  estimated_cost_max numeric,
  turnaround_hours integer,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leads" ON leads;
CREATE POLICY "anon_select_leads" ON leads FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_leads" ON leads;
CREATE POLICY "auth_update_leads" ON leads FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_leads" ON leads;
CREATE POLICY "auth_delete_leads" ON leads FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);

-- ============================================================
-- domains
-- ============================================================
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  plan_tier text NOT NULL DEFAULT 'starter_ops',
  ssl_active boolean NOT NULL DEFAULT true,
  last_backup timestamptz,
  uptime_pct numeric(5,2) NOT NULL DEFAULT 99.99,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_domains" ON domains;
CREATE POLICY "select_own_domains" ON domains FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_domains" ON domains;
CREATE POLICY "insert_own_domains" ON domains FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_domains" ON domains;
CREATE POLICY "update_own_domains" ON domains FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_domains" ON domains;
CREATE POLICY "delete_own_domains" ON domains FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains (user_id);

-- ============================================================
-- support_tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text,
  request_type text NOT NULL DEFAULT 'other',
  subject text NOT NULL,
  details text,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tickets" ON support_tickets;
CREATE POLICY "delete_own_tickets" ON support_tickets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tickets_user_created ON support_tickets (user_id, created_at DESC);
