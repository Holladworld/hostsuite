import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const SERVICE_TYPES = new Set(['domain', 'hosting', 'email', 'website']);
const MANAGEMENT_MODES = new Set(['self', 'hostsuite', 'help']);

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

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('managed_assets')
    .select('id,service_type,name,identifier,provider_name,management_mode,status,details,created_at,updated_at')
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Unable to load managed assets.' }, { status: 500 });
  return NextResponse.json({ assets: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const serviceType = typeof input.serviceType === 'string' ? input.serviceType : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const identifier = typeof input.identifier === 'string' ? input.identifier.trim() : '';
  const providerName = typeof input.providerName === 'string' ? input.providerName.trim() : null;
  const managementMode = typeof input.managementMode === 'string' ? input.managementMode : '';

  if (!SERVICE_TYPES.has(serviceType)) return NextResponse.json({ error: 'Unsupported service type.' }, { status: 400 });
  if (!name || !identifier) return NextResponse.json({ error: 'Name and identifier are required.' }, { status: 400 });
  if (!MANAGEMENT_MODES.has(managementMode)) return NextResponse.json({ error: 'Invalid management mode.' }, { status: 400 });

  const details = input.details && typeof input.details === 'object' && !Array.isArray(input.details) ? input.details : {};
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('managed_assets')
    .insert({
      user_id: user.id,
      service_type: serviceType,
      name,
      identifier,
      provider_name: providerName || null,
      management_mode: managementMode,
      status: 'pending_setup',
      details,
    })
    .select('id,service_type,name,identifier,provider_name,management_mode,status,details,created_at,updated_at')
    .single();

  if (error) return NextResponse.json({ error: 'Unable to save this service.' }, { status: 500 });
  return NextResponse.json({ asset: data }, { status: 201 });
}
