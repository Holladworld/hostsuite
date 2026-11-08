import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getHostingProvider } from '@/lib/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Action = 'nameservers' | 'epp' | 'lock';

async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data } = await supabase.auth.getUser(token);
  return data.user ?? null;
}

async function getDomainInstance(id: string, userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('service_instances').select('*').eq('id', id).eq('user_id', userId).eq('service_type', 'domain').maybeSingle();
  if (error) throw new Error('Unable to load domain service.');
  return data;
}

function providerStatus(result: { ok: boolean; code?: string; message?: string }) {
  if (result.ok) return 200;
  if (result.code === 'NOT_CONFIGURED') return 503;
  if (result.code === 'NOT_SUPPORTED') return 501;
  return 502;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('serviceId');
  const action = searchParams.get('action') as Action | null;
  if (!id || !action || !['nameservers', 'epp', 'lock'].includes(action)) return NextResponse.json({ error: 'A valid serviceId and action are required.' }, { status: 400 });

  try {
    const instance = await getDomainInstance(id, user.id);
    if (!instance) return NextResponse.json({ error: 'Domain service not found.' }, { status: 404 });
    const configuration = (instance.configuration ?? {}) as Record<string, unknown>;
    const domain = typeof configuration.domain === 'string' && configuration.domain.trim() ? configuration.domain.trim().toLowerCase() : instance.service_name;
    const provider = getHostingProvider();
    const result = action === 'nameservers'
      ? await provider.getDomainNameservers(domain)
      : action === 'epp'
        ? await provider.getDomainEppCode(domain)
        : await provider.getDomainLock(domain);
    return NextResponse.json({ domain, action, provider: provider.name, ...(result.ok ? result.data : { error: result.message, code: result.code }) }, { status: providerStatus(result) });
  } catch (error) {
    console.error('Domain management GET failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load domain management data.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  let body: { serviceId?: string; action?: Action; nameservers?: string[]; locked?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!body.serviceId || !body.action || !['nameservers', 'lock'].includes(body.action)) return NextResponse.json({ error: 'A valid serviceId and writable action are required.' }, { status: 400 });

  try {
    const instance = await getDomainInstance(body.serviceId, user.id);
    if (!instance) return NextResponse.json({ error: 'Domain service not found.' }, { status: 404 });
    const configuration = (instance.configuration ?? {}) as Record<string, unknown>;
    const domain = typeof configuration.domain === 'string' && configuration.domain.trim() ? configuration.domain.trim().toLowerCase() : instance.service_name;
    const provider = getHostingProvider();
    const result = body.action === 'nameservers'
      ? await provider.updateDomainNameservers(domain, Array.isArray(body.nameservers) ? body.nameservers.map((value) => value.trim()).filter(Boolean) : [])
      : await provider.updateDomainLock(domain, body.locked === true);
    return NextResponse.json({ domain, action: body.action, provider: provider.name, ...(result.ok ? result.data : { error: result.message, code: result.code }) }, { status: providerStatus(result) });
  } catch (error) {
    console.error('Domain management POST failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update domain.' }, { status: 500 });
  }
}
