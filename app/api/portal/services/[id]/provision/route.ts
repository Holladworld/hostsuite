import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { provisionServiceInstance } from '@/lib/service-lifecycle';

export const runtime = 'nodejs';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const { id } = await context.params;
    const admin = createAdminSupabaseClient();
    const { data: service, error } = await admin
      .from('service_instances')
      .select('id,user_id,status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !service) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    if (!['paid', 'provisioning_failed'].includes(service.status)) {
      return NextResponse.json({ error: 'This service is not awaiting provisioning.' }, { status: 409 });
    }

    const result = await provisionServiceInstance(admin, service.id);
    if (result.status === 'provisioning_failed') {
      return NextResponse.json({ status: result.status, error: result.error }, { status: 502 });
    }
    return NextResponse.json({ status: result.status });
  } catch (error) {
    console.error('Service provisioning retry failed', error);
    return NextResponse.json({ error: 'Unable to retry provisioning.' }, { status: 500 });
  }
}
