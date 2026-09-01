-- ============================================================
-- Tighten RLS across all tables for production hardening
-- ============================================================

-- leads: public INSERT only; admin-only SELECT/UPDATE/DELETE
DROP POLICY IF EXISTS anon_select_leads ON leads;
DROP POLICY IF EXISTS auth_update_leads ON leads;
DROP POLICY IF EXISTS auth_delete_leads ON leads;

CREATE POLICY "public_insert_leads" ON leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_leads" ON leads
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "admin_update_leads" ON leads
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin_delete_leads" ON leads
  FOR DELETE TO authenticated USING (is_admin());

-- clients: restrict to own SELECT/INSERT; admin full access
-- (already has good policies but tighten INSERT to self only)
DROP POLICY IF EXISTS insert_admin_clients ON clients;

CREATE POLICY "insert_own_clients" ON clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- domains: admin gets global SELECT; keep client policies as-is
-- (current policies are correct: client CRUD own rows, admin SELECT all)
-- Add admin full CRUD for the "Add Client Domain" admin feature
DROP POLICY IF EXISTS admin_select_domains ON domains;

CREATE POLICY "admin_select_domains" ON domains
  FOR SELECT TO authenticated USING (is_admin() OR auth.uid() = user_id);

CREATE POLICY "admin_insert_domains" ON domains
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "admin_update_domains" ON domains
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin_delete_domains" ON domains
  FOR DELETE TO authenticated USING (is_admin());

-- support_tickets: clients get SELECT + INSERT only (no UPDATE/DELETE)
-- admin gets full CRUD
DROP POLICY IF EXISTS update_own_tickets ON support_tickets;
DROP POLICY IF EXISTS delete_own_tickets ON support_tickets;

-- Keep existing admin policies (admin_select, admin_update, insert_own, select_own)
-- Re-add insert_own and select_own since we didn't drop them
-- (They already exist and are correct)

-- Ensure admin can insert tickets on behalf of clients
CREATE POLICY "admin_insert_tickets" ON support_tickets
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "admin_delete_tickets" ON support_tickets
  FOR DELETE TO authenticated USING (is_admin());

-- site_settings: public SELECT; admin-only INSERT/UPDATE/DELETE (already correct)
-- blogs: public SELECT for published; admin-only CRUD (already correct)
-- knowledge_base: public SELECT for published; admin-only CRUD (already correct)

-- ============================================================
-- Add status column default for leads
-- ============================================================
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new';
