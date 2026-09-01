import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { extractJson, generatedSiteSchema, SITE_GENERATION_INSTRUCTIONS } from '@/lib/ai-site';
import { getAIProvider } from '@/lib/ai/provider';

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

    const provider = getAIProvider();
    const prompt = `${SITE_GENERATION_INSTRUCTIONS}\n\nBusiness name: ${parsed.data.businessName}\nWebsite type: ${parsed.data.websiteType}\nBusiness description: ${parsed.data.description}`;

    const result = await provider.generate({
      system: 'You generate structured website definitions. Return only the requested JSON.',
      prompt,
      temperature: 0.7,
    });

    const site = generatedSiteSchema.parse(extractJson(result.content));
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

    return NextResponse.json({
      site,
      usage: result.usage || null,
      provider: provider.name,
      model: provider.model,
    });
  } catch (error) {
    console.error('Website generation error:', error);
    if (userId) {
      const providerName = process.env.AI_PROVIDER || 'openai-compatible';
      const model = process.env.AI_MODEL || 'unknown';
      await recordUsage({ userId, projectId, provider: providerName, model, status: 'failed' });
    }

    const message = error instanceof Error ? error.message : 'We could not generate the website. Please try again.';
    if (message.includes('not configured')) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: 'We could not generate the website. Please try again.' }, { status: 500 });
  }
}
