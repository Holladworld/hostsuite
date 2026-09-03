import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getAiBuilderProvider } from '@/lib/ai-builder';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from('ai_projects').select('id,name,kind,status,provider,model,external_project_id,deployment_url,custom_domain,metadata,created_at,updated_at').eq('id', params.id).eq('user_id', user.id).eq('kind', 'website').single();
    if (error) return NextResponse.json({ error: 'Website project not found.' }, { status: 404 });
    return NextResponse.json({ project: data, provider: getAiBuilderProvider().name });
  } catch (error) {
    console.error('AI builder project detail failed', error);
    return NextResponse.json({ error: 'We could not load this website project.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : null;
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 160) : undefined;
    if (metadata === null && name === undefined) return NextResponse.json({ error: 'No supported changes supplied.' }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (metadata) update.metadata = { ...metadata, source: 'hostsuite-ai-builder', schemaVersion: 1 };
    const { data, error } = await admin.from('ai_projects').update(update).eq('id', params.id).eq('user_id', user.id).eq('kind', 'website').select('id,name,kind,status,provider,model,external_project_id,deployment_url,custom_domain,metadata,created_at,updated_at').single();
    if (error) return NextResponse.json({ error: 'Website project not found or could not be updated.' }, { status: 404 });
    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('AI builder project update failed', error);
    return NextResponse.json({ error: 'We could not save your website project.' }, { status: 500 });
  }
}
