import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

function cleanString(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim().slice(0, 100)).filter(Boolean).slice(0, 20);
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from('ai_projects').select('id,name,kind,status,provider,model,external_project_id,deployment_url,custom_domain,metadata,created_at,updated_at').eq('user_id', user.id).eq('kind', 'website').neq('status', 'archived').order('updated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ projects: data ?? [] });
  } catch (error) {
    console.error('AI builder projects failed', error);
    return NextResponse.json({ error: 'We could not load your website projects right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const businessName = cleanString(body.businessName, 160);
    const businessType = cleanString(body.businessType, 120);
    const description = cleanString(body.description, 2000);
    if (!businessName || !businessType || !description) {
      return NextResponse.json({ error: 'Business name, business type and description are required.' }, { status: 400 });
    }

    const projectName = cleanString(body.name, 160) || `${businessName} website`;
    const metadata = {
      businessName,
      businessType,
      description,
      location: cleanString(body.location, 160),
      services: cleanList(body.services),
      style: cleanString(body.style, 120),
      source: 'hostsuite-ai-builder',
      schemaVersion: 1,
    };

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from('ai_projects').insert({
      user_id: user.id,
      name: projectName,
      kind: 'website',
      status: 'draft',
      provider: 'unconfigured',
      metadata,
    }).select('id,name,kind,status,provider,model,external_project_id,deployment_url,custom_domain,metadata,created_at,updated_at').single();
    if (error) throw error;

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error('AI builder project creation failed', error);
    return NextResponse.json({ error: 'We could not create your website project.' }, { status: 500 });
  }
}
