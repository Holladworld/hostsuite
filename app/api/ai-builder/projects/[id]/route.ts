import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('ai_projects')
      .select('id,name,kind,status,provider,model,metadata,created_at,updated_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .eq('kind', 'website')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Website project not found.' }, { status: 404 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('AI website project detail failed:', error);
    return NextResponse.json({ error: 'We could not load this website project.' }, { status: 500 });
  }
}
