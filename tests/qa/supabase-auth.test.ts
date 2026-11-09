import { describe, expect, it } from 'vitest';
import { extractBearerToken } from '../../lib/supabase-auth';

describe('Supabase bearer authentication', () => {
  it('extracts a bearer token', () => {
    const request = new Request('https://hostsuite.test/api/billing/summary', {
      headers: { Authorization: 'Bearer user-access-token' },
    });
    expect(extractBearerToken(request)).toBe('user-access-token');
  });

  it('accepts case-insensitive bearer scheme', () => {
    const request = new Request('https://hostsuite.test/api/billing/summary', {
      headers: { Authorization: 'bearer user-access-token' },
    });
    expect(extractBearerToken(request)).toBe('user-access-token');
  });

  it('rejects missing, malformed and empty authorization headers', () => {
    const missing = new Request('https://hostsuite.test/api/billing/summary');
    const malformed = new Request('https://hostsuite.test/api/billing/summary', {
      headers: { Authorization: 'Basic credentials' },
    });
    const empty = new Request('https://hostsuite.test/api/billing/summary', {
      headers: { Authorization: 'Bearer   ' },
    });

    expect(extractBearerToken(missing)).toBeNull();
    expect(extractBearerToken(malformed)).toBeNull();
    expect(extractBearerToken(empty)).toBeNull();
  });
});
