import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { extractJson, generatedSiteSchema, SITE_GENERATION_INSTRUCTIONS } from '@/lib/ai-site';

const requestSchema = z.object({
  businessName: z.string().min(2).max(120),
  websiteType: z.string().min(2).max(120),
  description: z.string().min(20).max(3000),
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

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'You must be signed in to use the website builder.' }, { status: 401 });

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Please provide a business name, website type and a useful business description.' }, { status: 400 });

    const apiKey = process.env.AI_API_KEY;
    const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = process.env.AI_MODEL;
    if (!apiKey || !model) {
      return NextResponse.json({ error: 'AI generation is not configured yet. Add AI_API_KEY and AI_MODEL to the server environment.' }, { status: 503 });
    }

    const prompt = `${SITE_GENERATION_INSTRUCTIONS}\n\nBusiness name: ${parsed.data.businessName}\nWebsite type: ${parsed.data.websiteType}\nBusiness description: ${parsed.data.description}`;
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.7, messages: [{ role: 'system', content: 'You generate structured website definitions.' }, { role: 'user', content: prompt }] }),
    });

    if (!response.ok) {
      const providerText = await response.text();
      console.error('AI provider error:', response.status, providerText.slice(0, 500));
      return NextResponse.json({ error: 'The AI provider could not generate the website right now.' }, { status: 502 });
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return NextResponse.json({ error: 'The AI provider returned an unexpected response.' }, { status: 502 });

    const site = generatedSiteSchema.parse(extractJson(content));

    const admin = createAdminSupabaseClient();
    const { error: usageError } = await admin.rpc('record_ai_usage', {
      p_user_id: user.id,
      p_feature: 'website_builder',
      p_provider: baseUrl,
      p_model: model,
      p_units: 1,
      p_request_id: requestId,
      p_metadata: { websiteType: parsed.data.websiteType },
    });
    if (usageError) console.error('AI usage ledger write failed:', usageError.message);

    return NextResponse.json({ site, usage: { units: 1, requestId } });
  } catch (error) {
    console.error('Website generation error:', error);
    return NextResponse.json({ error: 'We could not generate the website. Please try again.' }, { status: 500 });
  }
}
