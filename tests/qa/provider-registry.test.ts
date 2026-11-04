import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHostingProviderStatus } from '../../lib/providers/registry';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('hosting provider registry', () => {
  it('fails closed when no hosting provider is selected', () => {
    vi.stubEnv('HOSTING_PROVIDER', 'unconfigured');

    const status = getHostingProviderStatus();

    expect(status.mode).toBe('unconfigured');
    expect(status.configured).toBe(false);
    expect(status.readyCapabilities).toEqual([]);
  });

  it('identifies mock mode explicitly rather than presenting it as a live provider', () => {
    vi.stubEnv('HOSTING_PROVIDER', 'mock');

    const status = getHostingProviderStatus();

    expect(status.mode).toBe('mock');
    expect(status.configured).toBe(true);
    expect(status.readyCapabilities).toEqual(status.supportedCapabilities);
  });

  it('keeps domain search unavailable until its documented route is configured', () => {
    vi.stubEnv('HOSTING_PROVIDER', 'whogohost');
    vi.stubEnv('WHOGOHOST_API_EMAIL', 'reseller@example.test');
    vi.stubEnv('WHOGOHOST_API_KEY', 'test-key');
    vi.stubEnv('WHOGOHOST_DOMAIN_AVAILABILITY_PATH', '');

    const status = getHostingProviderStatus();

    expect(status.mode).toBe('live');
    expect(status.configured).toBe(true);
    expect(status.readyCapabilities).not.toContain('domain.search');
    expect(status.supportedCapabilities).toContain('domain.search');
  });

  it('reports live capabilities ready only when required credentials and search route exist', () => {
    vi.stubEnv('HOSTING_PROVIDER', 'whogohost');
    vi.stubEnv('WHOGOHOST_API_EMAIL', 'reseller@example.test');
    vi.stubEnv('WHOGOHOST_API_KEY', 'test-key');
    vi.stubEnv('WHOGOHOST_DOMAIN_AVAILABILITY_PATH', '/domains/{domain}/availability');

    const status = getHostingProviderStatus();

    expect(status.mode).toBe('live');
    expect(status.configured).toBe(true);
    expect(status.readyCapabilities).toEqual(status.supportedCapabilities);
  });

  it('does not report a live provider configured when credentials are missing', () => {
    vi.stubEnv('HOSTING_PROVIDER', 'whogohost');
    vi.stubEnv('WHOGOHOST_API_EMAIL', '');
    vi.stubEnv('WHOGOHOST_API_KEY', '');
    vi.stubEnv('WHOGOHOST_DOMAIN_AVAILABILITY_PATH', '/domains/{domain}/availability');

    const status = getHostingProviderStatus();

    expect(status.configured).toBe(false);
    expect(status.readyCapabilities).toEqual([]);
  });

  it('rejects unknown provider names instead of silently treating them as unconfigured', () => {
    vi.stubEnv('HOSTING_PROVIDER', 'unknown-provider');

    expect(() => getHostingProviderStatus()).toThrow('Unknown hosting provider');
  });
});
