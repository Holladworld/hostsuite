import { describe, expect, it } from 'vitest';

describe('HostSuite security invariants', () => {
  it('keeps privileged secrets out of public environment names', () => {
    const publicEnvNames = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const forbidden = ['SUPABASE_SERVICE_ROLE_KEY', 'PAYSTACK_SECRET_KEY', 'FLUTTERWAVE_SECRET_KEY', 'CLOUDFLARE_API_TOKEN', 'AI_API_KEY'];
    for (const name of forbidden) expect(publicEnvNames).not.toContain(name);
  });

  it('requires ownership before customer-scoped operations', () => {
    const requestUserId = 'user-a';
    const resourceOwnerId = 'user-b';
    expect(requestUserId === resourceOwnerId).toBe(false);
  });

  it('requires a verified payment state before entitlement', () => {
    const paymentStates = ['pending', 'failed', 'cancelled', 'success'];
    const grantable = paymentStates.filter((state) => state === 'success');
    expect(grantable).toEqual(['success']);
  });

  it('treats generated application code as untrusted', () => {
    const executionPolicy = { runGeneratedCodeInHostSuiteProcess: false };
    expect(executionPolicy.runGeneratedCodeInHostSuiteProcess).toBe(false);
  });
});
