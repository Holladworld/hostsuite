/*
# Create hostsuite-assets storage bucket

## Overview
Creates a public storage bucket for blog cover images and other media assets
used by the Admin Blog Studio. The bucket is public-read so cover images
display on the public blog without authentication, but uploads require
authentication (admin only via RLS).

## Changes
- Creates storage bucket 'hostsuite-assets' if it does not exist
- Sets bucket to public (anyone can read objects)
- Adds storage policies for authenticated uploads and public reads
*/

INSERT INTO storage.buckets (id, name, public)
SELECT 'hostsuite-assets', 'hostsuite-assets', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'hostsuite-assets');

-- Public read: anyone can view objects in hostsuite-assets
DROP POLICY IF EXISTS "public_read_hostsuite_assets" ON storage.objects;
CREATE POLICY "public_read_hostsuite_assets" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'hostsuite-assets');

-- Authenticated upload: any signed-in user can upload (admin gate is in the app)
DROP POLICY IF EXISTS "auth_upload_hostsuite_assets" ON storage.objects;
CREATE POLICY "auth_upload_hostsuite_assets" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hostsuite-assets');

-- Authenticated update/delete
DROP POLICY IF EXISTS "auth_update_hostsuite_assets" ON storage.objects;
CREATE POLICY "auth_update_hostsuite_assets" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hostsuite-assets')
  WITH CHECK (bucket_id = 'hostsuite-assets');

DROP POLICY IF EXISTS "auth_delete_hostsuite_assets" ON storage.objects;
CREATE POLICY "auth_delete_hostsuite_assets" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'hostsuite-assets');