import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('service_instances').select('id,user_id,order_id,order_item_id,service_type,service_name,status,configuration,provider,provider_resource_id,provider_status,control_panel_url,last_error,created_at,provisioned_at').order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: 'Unable to load service instances.' }, { status: 500 });
  return NextResponse.json({ services: data ?? [] });
}
