import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

const projectInputSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  businessType: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(2000),
  name: z.string().trim().min(1).max(160).optional(),
  location: z.string().trim().max(160).optional(),
  services: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  style: z.string().trim().max(120).optional(),
});

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const rawLimit = Number(request.nextUrl.searchParams.get('limit') || 20);
    const rawOffset = Number(request.nextUrl.searchParams.get('offset') || 0);
    const limit = Number.isSafeInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;
    const offset = Number.isSafeInteger(rawOffset) ? Math.max(rawOffset, 0) : 0;

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('ai_projects')
      .select('id,name,kind,status,provider,model,created_at,updated_at')
      .eq('user_id', user.id)
      .eq('kind', 'website')
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const projects = data ?? [];
    return NextResponse.json({
      projects,
      pagination: { limit, offset, hasMore: projects.length === limit, nextOffset: projects.length === limit ? offset + limit : null },
    });
  } catch (error) {
    console.error('AI website projects list failed:', error);
    return NextResponse.json({ error: 'We could not load your website projects.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const parsed = projectInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a business name, website type and a useful business description.' }, { status: 400 });
    }

    const input = parsed.data;
    const metadata = {
      businessName: input.businessName,
      businessType: input.businessType,
      description: input.description,
      location: input.location ?? '',
      services: input.services ?? [],
      style: input.style ?? '',
      source: 'hostsuite-website-builder',
      schemaVersion: 1,
    };

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('ai_projects')
      .insert({
        user_id: user.id,
        name: input.name || input.businessName + ' website',
        kind: 'website',
        status: 'draft',
        provider: null,
        metadata,
      })
      .select('id,name,kind,status,provider,model,metadata,created_at,updated_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error('AI website project creation failed:', error);
    return NextResponse.json({ error: 'We could not save your website project. Please try again.' }, { status: 500 });
  }
}
