import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

  const result = await provisionServiceInstance(params.id);
  if (result.code === 'NOT_FOUND') return NextResponse.json({ error: result.message }, { status: 404 });

  // Ownership is enforced before retrying so a customer cannot provision another
  // customer's service instance. The provisioning service itself remains server-only.
  // The service function intentionally does not accept a caller-supplied user ID.
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
