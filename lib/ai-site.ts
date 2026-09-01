import { z } from 'zod';

export const siteBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), eyebrow: z.string().max(80), title: z.string().max(160), description: z.string().max(500), primaryCta: z.string().max(60), secondaryCta: z.string().max(60) }),
  z.object({ type: z.literal('features'), title: z.string().max(120), items: z.array(z.object({ title: z.string().max(80), description: z.string().max(240) })).min(2).max(6) }),
  z.object({ type: z.literal('about'), title: z.string().max(120), body: z.string().max(700) }),
  z.object({ type: z.literal('cta'), title: z.string().max(120), description: z.string().max(300), button: z.string().max(60) }),
]);

export const generatedSiteSchema = z.object({
  siteName: z.string().min(1).max(120),
  tagline: z.string().max(180),
  navigation: z.array(z.string().max(40)).min(2).max(6),
  blocks: z.array(siteBlockSchema).min(3).max(8),
});

export type GeneratedSite = z.infer<typeof generatedSiteSchema>;

export const SITE_GENERATION_INSTRUCTIONS = `Return ONLY valid JSON matching this exact shape:
{
  "siteName": string,
  "tagline": string,
  "navigation": string[],
  "blocks": [
    {"type":"hero","eyebrow":string,"title":string,"description":string,"primaryCta":string,"secondaryCta":string},
    {"type":"features","title":string,"items":[{"title":string,"description":string}]},
    {"type":"about","title":string,"body":string},
    {"type":"cta","title":string,"description":string,"button":string}
  ]
}
Create a concise, professional small-business website. Do not include markdown, HTML, CSS, JavaScript, URLs, or claims that were not supplied by the user. Use only the business facts in the brief. Keep navigation simple.`;

export function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('AI did not return a JSON site definition.');
  return JSON.parse(cleaned.slice(start, end + 1));
}
