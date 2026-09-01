-- HS-018 / HS-016 follow-up: storage writes are admin-only.
-- Public read remains enabled so published site assets can render.

DROP POLICY IF EXISTS "auth_upload_hostsuite_assets" ON storage.objects;
CREATE POLICY "admin_upload_hostsuite_assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'hostsuite-assets' AND public.is_admin());

DROP POLICY IF EXISTS "auth_update_hostsuite_assets" ON storage.objects;
CREATE POLICY "admin_update_hostsuite_assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'hostsuite-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'hostsuite-assets' AND public.is_admin());

DROP POLICY IF EXISTS "auth_delete_hostsuite_assets" ON storage.objects;
CREATE POLICY "admin_delete_hostsuite_assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'hostsuite-assets' AND public.is_admin());
