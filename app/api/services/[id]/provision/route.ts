import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { provisionServiceInstance } from '@/lib/services/provisioning';

export const runtime = 'nodejs';

async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data } = await supabase.auth.getUser(token);
  return data.user ?? null;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: instance, error } = await admin
    .from('service_instances')
    .select('user_id')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Unable to load service.' }, { status: 500 });
  if (!instance) return NextResponse.json({ error: 'Service instance not found.' }, { status: 404 });
  if (instance.user_id !== user.id) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const result = await provisionServiceInstance(params.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
