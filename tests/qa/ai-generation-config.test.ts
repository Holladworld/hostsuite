import { afterEach, describe, expect, it } from 'vitest';
import { getAiGenerationDailyLimit, getAiGenerationLeaseSeconds } from '../../lib/ai-generation-config';

afterEach(() => {
  delete process.env.AI_GENERATION_MAX_PER_USER_PER_DAY;
  delete process.env.AI_GENERATION_LEASE_SECONDS;
});

describe('AI generation guardrail configuration', () => {
  it('uses a conservative default daily limit', () => {
    expect(getAiGenerationDailyLimit('')).toBe(5);
  });

  it('accepts a configured daily limit and caps extreme values', () => {
    expect(getAiGenerationDailyLimit('12')).toBe(12);
    expect(getAiGenerationDailyLimit('99999')).toBe(1000);
  });

  it('falls back safely for invalid daily limits', () => {
    expect(getAiGenerationDailyLimit('0')).toBe(5);
    expect(getAiGenerationDailyLimit('not-a-number')).toBe(5);
  });

  it('uses a recoverable generation lease and bounds configured values', () => {
    expect(getAiGenerationLeaseSeconds('')).toBe(900);
    expect(getAiGenerationLeaseSeconds('1200')).toBe(1200);
    expect(getAiGenerationLeaseSeconds('30')).toBe(900);
    expect(getAiGenerationLeaseSeconds('99999')).toBe(3600);
  });
});
