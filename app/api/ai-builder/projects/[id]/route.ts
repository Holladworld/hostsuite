import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { z } from 'zod';

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


const projectBriefSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  businessType: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(2000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const parsed = projectBriefSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a business name, website type and a useful business description.' }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const { data: current, error: lookupError } = await admin
      .from('ai_projects')
      .select('id,metadata')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .eq('kind', 'website')
      .single();

    if (lookupError || !current) {
      return NextResponse.json({ error: 'Website project not found.' }, { status: 404 });
    }

    const metadata = current.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata)
      ? current.metadata as Record<string, unknown>
      : {};

    const { data, error } = await admin
      .from('ai_projects')
      .update({
        name: parsed.data.businessName + ' website',
        status: 'draft',
        metadata: {
          ...metadata,
          businessName: parsed.data.businessName,
          businessType: parsed.data.businessType,
          description: parsed.data.description,
          source: 'hostsuite-website-builder',
          schemaVersion: 1,
        },
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .eq('kind', 'website')
      .select('id,name,kind,status,provider,model,metadata,created_at,updated_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('AI website project update failed:', error);
    return NextResponse.json({ error: 'We could not save your website project changes.' }, { status: 500 });
  }
}
