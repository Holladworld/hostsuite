import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { extractJson, generatedSiteSchema, SITE_GENERATION_INSTRUCTIONS } from '@/lib/ai-site';
import { getAIProvider } from '@/lib/ai/provider';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { mergeGeneratedSiteIntoProjectMetadata } from '@/lib/ai-projects';
import { getAiGenerationDailyLimit, getAiGenerationLeaseSeconds } from '@/lib/ai-generation-config';

export const runtime = 'nodejs';

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
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
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
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('ai_usage_events').insert({
    user_id: input.userId,
    project_id: input.projectId || null,
    action: 'generation',
    provider: input.provider,
    model: input.model,
    input_tokens: input.inputTokens ?? 0,
    output_tokens: input.outputTokens ?? 0,
    total_tokens: input.totalTokens ?? 0,
    status: input.status,
  });
  if (error) throw error;
}

async function finishAttempt(input: {
  attemptId: string;
  status: 'completed' | 'failed';
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  metadata?: Record<string, unknown> | null;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc('finish_ai_generation', {
    p_attempt_id: input.attemptId,
    p_status: input.status,
    p_provider: input.provider,
    p_model: input.model,
    p_input_tokens: input.inputTokens ?? 0,
    p_output_tokens: input.outputTokens ?? 0,
    p_total_tokens: input.totalTokens ?? 0,
    p_project_metadata: input.metadata ?? null,
  });
  if (error) throw error;
  return data === true;
}

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  let projectId: string | undefined;
  let attemptId: string | null = null;
  let generationClaimed = false;
  let providerName = process.env.AI_PROVIDER || 'openai-compatible';
  let modelName = process.env.AI_MODEL || 'unknown';

  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'You must be signed in to use the website builder.' }, { status: 401 });
    userId = user.id;

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a business name, website type and a useful business description.' }, { status: 400 });
    }
    projectId = parsed.data.projectId;

    const admin = createAdminSupabaseClient();
    attemptId = crypto.randomUUID();
    const { data: claimRows, error: claimError } = await admin.rpc('claim_ai_generation', {
      p_user_id: userId,
      p_project_id: projectId ?? null,
      p_attempt_id: attemptId,
      p_daily_limit: getAiGenerationDailyLimit(),
      p_lease_seconds: getAiGenerationLeaseSeconds(),
    });
    if (claimError) throw claimError;

    const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
    if (!claim?.allowed) {
      if (claim?.reason === 'daily_limit_reached') {
        return NextResponse.json(
          { error: 'You have reached today’s website-generation limit. Please try again tomorrow.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'This website project is currently unavailable for generation. Refresh the project and try again.' },
        { status: 409 }
      );
    }

    generationClaimed = true;
    const provider = getAIProvider();
    providerName = provider.name;
    modelName = provider.model;
    const prompt = `${SITE_GENERATION_INSTRUCTIONS}\n\nBusiness name: ${parsed.data.businessName}\nWebsite type: ${parsed.data.websiteType}\nBusiness description: ${parsed.data.description}`;

    const result = await provider.generate({
      system: 'You generate structured website definitions. Return only the requested JSON.',
      prompt,
      temperature: 0.7,
    });

    const site = generatedSiteSchema.parse(extractJson(result.content));
    let metadata: Record<string, unknown> | null = null;

    if (projectId) {
      const { data: project, error: projectError } = await admin
        .from('ai_projects')
        .select('metadata')
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('generation_attempt_id', attemptId)
        .single();
      if (projectError || !project) throw new Error('The website project generation lease is no longer active.');
      metadata = mergeGeneratedSiteIntoProjectMetadata(project.metadata, site);
    }

    const completed = await finishAttempt({
      attemptId,
      status: 'completed',
      provider: providerName,
      model: modelName,
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
      totalTokens: result.usage?.totalTokens,
      metadata,
    });
    if (!completed) {
      return NextResponse.json(
        { error: 'This generation attempt expired before it could be saved. Please retry the project.' },
        { status: 409 }
      );
    }

    try {
      await recordUsage({
        userId,
        projectId,
        provider: providerName,
        model: modelName,
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
      provider: providerName,
      model: modelName,
    });
  } catch (error) {
    console.error('Website generation error:', error);
    if (userId && attemptId && generationClaimed) {
      try {
        await finishAttempt({
          attemptId,
          status: 'failed',
          provider: providerName,
          model: modelName,
        });
      } catch (persistenceError) {
        console.error('Could not finalize failed AI generation attempt:', persistenceError);
      }
    }

    if (userId && attemptId && generationClaimed) {
      try {
        await recordUsage({ userId, projectId, provider: providerName, model: modelName, status: 'failed' });
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
