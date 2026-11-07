export const AI_PROJECT_GENERATION_IN_PROGRESS = 'generating' as const;

export const AI_PROJECT_GENERATION_CLAIMABLE_STATUSES = [
  'draft',
  'ready',
  'failed',
] as const;

export function canFinalizeAiProjectGeneration(status: string): boolean {
  return status === AI_PROJECT_GENERATION_IN_PROGRESS;
}
