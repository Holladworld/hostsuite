import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { z } from 'zod';
import { ASSISTANT_ESCALATION_MESSAGE, AI_ASSISTANT_BOUNDARY, DEFAULT_DIAGNOSTIC_CHECKS } from '@/lib/ai-assistant';

const requestSchema = z.object({
  message: z.string().min(2).max(4000),
  target: z.string().max(253).optional(),
  diagnostics: z.array(z.object({
    check: z.enum(DEFAULT_DIAGNOSTIC_CHECKS as [string, ...string[]]),
    status: z.enum(['pending', 'running', 'healthy', 'problem', 'unavailable']),
    summary: z.string().max(500).optional(),
  })).max(20).optional(),
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

function fallback(message: string, diagnostics: z.infer<typeof requestSchema>['diagnostics']) {
  const problems = (diagnostics ?? []).filter((item) => item.status === 'problem');
  if (problems.length) {
    return `I found an issue in the verified checks: ${problems.map((item) => `${item.check}: ${item.summary ?? 'reported a problem'}`).join('; ')}. I can explain what this means, but I will not change infrastructure unless an authorized HostSuite action is available.`;
  }
  if ((diagnostics ?? []).some((item) => item.status === 'healthy')) {
    return ASSISTANT_ESCALATION_MESSAGE;
  }
  return `I can help investigate “${message}”, but I do not have live diagnostic results for it yet. ${ASSISTANT_ESCALATION_MESSAGE}`;
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'You must be signed in to use the HostSuite Assistant.' }, { status: 401 });

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Please describe the problem you are experiencing.' }, { status: 400 });

    const diagnostics = parsed.data.diagnostics ?? [];
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = process.env.AI_MODEL;

    let answer = fallback(parsed.data.message, diagnostics);
    if (apiKey && model) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: `You are the HostSuite technical assistant. ${AI_ASSISTANT_BOUNDARY} Never claim that you checked DNS, HTTP, SSL, hosting, domain, monitoring, email or any other system unless that result appears in the verified diagnostics supplied by the server. If evidence is insufficient, say so and recommend escalation. Keep advice understandable to a nontechnical business owner.` },
            { role: 'user', content: JSON.stringify({ problem: parsed.data.message, target: parsed.data.target, verifiedDiagnostics: diagnostics }) },
          ],
        }),
      });
      if (response.ok) {
        const result = await response.json();
        const content = result?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim()) answer = content.trim();
      }
    }

    const admin = createAdminSupabaseClient();
    const { error: usageError } = await admin.rpc('record_ai_usage', {
      p_user_id: user.id,
      p_feature: 'assistant',
      p_provider: baseUrl,
      p_model: model ?? null,
      p_units: 1,
      p_request_id: requestId,
      p_metadata: { target: parsed.data.target ?? null, diagnosticCount: diagnostics.length },
    });
    if (usageError) console.error('AI assistant usage ledger write failed:', usageError.message);

    return NextResponse.json({ answer, diagnostics, escalated: diagnostics.length === 0 || diagnostics.some((item) => item.status === 'unavailable'), usage: { units: 1, requestId } });
  } catch (error) {
    console.error('AI assistant error:', error);
    return NextResponse.json({ error: 'The assistant is temporarily unavailable.' }, { status: 500 });
  }
}
