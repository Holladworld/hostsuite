import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getHostingProvider } from '@/lib/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Action = 'webmail' | 'create-mailbox';

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

async function getEmailInstance(id: string, userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('service_instances').select('*').eq('id', id).eq('user_id', userId).eq('service_type', 'email').maybeSingle();
  if (error) throw new Error('Unable to load email service.');
  return data;
}

function resultStatus(result: { ok: boolean; code?: string }) {
  if (result.ok) return 200;
  if (result.code === 'NOT_CONFIGURED') return 503;
  if (result.code === 'NOT_SUPPORTED') return 501;
  return 502;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  let body: { serviceId?: string; action?: Action; mailbox?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!body.serviceId || !body.action || !['webmail', 'create-mailbox'].includes(body.action)) return NextResponse.json({ error: 'A valid serviceId and action are required.' }, { status: 400 });

  try {
    const instance = await getEmailInstance(body.serviceId, user.id);
    if (!instance) return NextResponse.json({ error: 'Email service not found.' }, { status: 404 });
    const configuration = (instance.configuration ?? {}) as Record<string, unknown>;
    const domain = typeof configuration.domain === 'string' && configuration.domain.trim() ? configuration.domain.trim().toLowerCase() : '';
    if (!domain) return NextResponse.json({ error: 'This email service has no configured domain.' }, { status: 422 });

    const provider = getHostingProvider();
    if (body.action === 'webmail') {
      if (!instance.provider_resource_id) return NextResponse.json({ error: 'This email service has not received a provider resource yet.' }, { status: 409 });
      const result = await provider.getWebmailUrl(instance.provider_resource_id);
      return NextResponse.json({ serviceId: instance.id, action: body.action, provider: provider.name, ...(result.ok ? result.data : { error: result.message, code: result.code }) }, { status: resultStatus(result) });
    }

    const mailbox = typeof body.mailbox === 'string' ? body.mailbox.trim().toLowerCase() : '';
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}$/.test(mailbox)) return NextResponse.json({ error: 'Enter a valid mailbox name, for example hello.' }, { status: 422 });
    const result = await provider.createMailbox({ customerId: user.id, domain, mailbox });
    return NextResponse.json({ serviceId: instance.id, action: body.action, provider: provider.name, ...(result.ok ? result.data : { error: result.message, code: result.code }) }, { status: resultStatus(result) });
  } catch (error) {
    console.error('Email management POST failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to complete email management action.' }, { status: 500 });
  }
}
