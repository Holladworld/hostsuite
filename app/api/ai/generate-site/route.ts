import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { extractJson, generatedSiteSchema, SITE_GENERATION_INSTRUCTIONS } from '@/lib/ai-site';
import { getAIProvider } from '@/lib/ai/provider';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { mergeGeneratedSiteIntoProjectMetadata } from '@/lib/ai-projects';

const requestSchema = z.object({
  businessName: z.string().min(2).max(120),
  websiteType: z.string().min(2).max(120),
  description: z.string().min(20).max(3000),
  projectId: z.string().uuid().optional(),
});

async function requireUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

async function recordUsage(input: {
  userId: string;
  projectId?: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  status: 'completed' | 'failed';
}) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) return;

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  await admin.from('ai_usage_events').insert({
    user_id: input.userId,
    project_id: input.projectId || null,
    action: 'generation',
    provider: input.provider,
    model: input.model,
    input_tokens: input.inputTokens || 0,
    output_tokens: input.outputTokens || 0,
    total_tokens: input.totalTokens || 0,
    status: input.status,
  });
}

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  let projectId: string | undefined;

  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'You must be signed in to use the website builder.' }, { status: 401 });
    userId = user.id;

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a business name, website type and a useful business description.' }, { status: 400 });
    }
    projectId = parsed.data.projectId;

    let projectMetadata: Record<string, unknown> | null = null;
    if (projectId) {
      const admin = createAdminSupabaseClient();
      const { data: project, error: projectError } = await admin
        .from('ai_projects')
        .select('id,metadata,status')
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('kind', 'website')
        .single();

      if (projectError || !project) {
        return NextResponse.json({ error: 'Website project not found.' }, { status: 404 });
      }
      if (project.status === 'deployed') {
        return NextResponse.json(
          { error: 'This website is already deployed. Create a separate draft to make changes without affecting the live website.' },
          { status: 409 }
        );
      }
      if (project.status === 'archived' || project.status === 'generating') {
        return NextResponse.json({ error: 'This website project cannot be generated in its current state.' }, { status: 409 });
      }

      projectMetadata = project.metadata && typeof project.metadata === 'object' && !Array.isArray(project.metadata)
        ? project.metadata as Record<string, unknown>
        : {};

      const { data: claimedProject, error: statusError } = await admin
        .from('ai_projects')
        .update({ status: 'generating' })
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('kind', 'website')
        .in('status', ['draft', 'ready', 'failed'])
        .select('id')
        .maybeSingle();

      if (statusError) throw statusError;
      if (!claimedProject) {
        return NextResponse.json(
          { error: 'This website project changed state. Refresh it before trying again.' },
          { status: 409 }
        );
      }
    }

    const provider = getAIProvider();
    const prompt = `${SITE_GENERATION_INSTRUCTIONS}\n\nBusiness name: ${parsed.data.businessName}\nWebsite type: ${parsed.data.websiteType}\nBusiness description: ${parsed.data.description}`;

    const result = await provider.generate({
      system: 'You generate structured website definitions. Return only the requested JSON.',
      prompt,
      temperature: 0.7,
    });

    const site = generatedSiteSchema.parse(extractJson(result.content));

    if (projectId) {
      const admin = createAdminSupabaseClient();
      const { data: savedProject, error: saveError } = await admin
        .from('ai_projects')
        .update({
          status: 'ready',
          provider: provider.name,
          model: provider.model,
          metadata: mergeGeneratedSiteIntoProjectMetadata(projectMetadata, site),
        })
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('kind', 'website')
        .eq('status', 'generating')
        .select('id')
        .maybeSingle();

      if (saveError) throw saveError;
      if (!savedProject) {
        return NextResponse.json(
          { error: 'This website project changed state while it was generating. Refresh it before continuing.' },
          { status: 409 }
        );
      }
    }

    try {
      await recordUsage({
        userId,
        projectId,
        provider: provider.name,
        model: provider.model,
        inputTokens: result.usage?.inputTokens,
        outputTokens: result.usage?.outputTokens,
        totalTokens: result.usage?.totalTokens,
        status: 'completed',
      });
    } catch (usageError) {
      console.error('Could not record completed AI usage:', usageError);
    }

    return NextResponse.json({
      site,
      usage: result.usage || null,
      provider: provider.name,
      model: provider.model,
    });
  } catch (error) {
    console.error('Website generation error:', error);
    if (userId && projectId) {
      try {
        const admin = createAdminSupabaseClient();
        await admin
          .from('ai_projects')
          .update({ status: 'failed' })
          .eq('id', projectId)
          .eq('user_id', userId)
          .eq('kind', 'website')
          .eq('status', 'generating');
      } catch (persistenceError) {
        console.error('Could not update failed AI project status:', persistenceError);
      }
    }

    if (userId) {
      const providerName = process.env.AI_PROVIDER || 'openai-compatible';
      const model = process.env.AI_MODEL || 'unknown';
      try {
        await recordUsage({ userId, projectId, provider: providerName, model, status: 'failed' });
      } catch (usageError) {
        console.error('Could not record failed AI usage:', usageError);
      }
    }

    const message = error instanceof Error ? error.message : 'We could not generate the website. Please try again.';
    if (message.includes('not configured')) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: 'We could not generate the website. Please try again.' }, { status: 500 });
  }
}
