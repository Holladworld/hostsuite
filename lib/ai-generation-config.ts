const DEFAULT_DAILY_GENERATION_LIMIT = 5;
const DEFAULT_GENERATION_LEASE_SECONDS = 900;

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) return fallback;
  return Math.min(parsed, maximum);
}

/** Operational abuse guardrail; product credit pricing/allowances remain separate. */
export function getAiGenerationDailyLimit(value = process.env.AI_GENERATION_MAX_PER_USER_PER_DAY): number {
  return boundedInteger(value, DEFAULT_DAILY_GENERATION_LIMIT, 1, 1000);
}

/** A generation claim can be reclaimed after this lease expires. */
export function getAiGenerationLeaseSeconds(value = process.env.AI_GENERATION_LEASE_SECONDS): number {
  return boundedInteger(value, DEFAULT_GENERATION_LEASE_SECONDS, 60, 3600);
}
