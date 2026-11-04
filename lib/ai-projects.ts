import type { GeneratedSite } from '@/lib/ai-site';

export function mergeGeneratedSiteIntoProjectMetadata(
  existing: unknown,
  site: GeneratedSite,
  generatedAt = new Date().toISOString()
): Record<string, unknown> {
  const current = existing && typeof existing === 'object' && !Array.isArray(existing)
    ? existing as Record<string, unknown>
    : {};

  return {
    ...current,
    generatedSite: site,
    generation: {
      status: 'ready',
      schemaVersion: 1,
      generatedAt,
    },
  };
}
