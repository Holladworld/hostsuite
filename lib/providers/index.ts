import { mockProvider } from './mock';
import { unconfiguredProvider } from './unconfigured';
import type { HostingProvider } from './types';

/**
 * Select the server-side provider. Live provider credentials are never exposed
 * to the browser. Until a verified reseller adapter is installed, the live
 * provider intentionally reports NOT_CONFIGURED instead of creating fake data.
 */
export function getHostingProvider(): HostingProvider {
  const provider = (process.env.HOSTING_PROVIDER || 'unconfigured').toLowerCase();

  if (provider === 'mock') return mockProvider;
  if (provider === 'whogohost' || provider === 'go54' || provider === 'unconfigured') return unconfiguredProvider;

  throw new Error(`Unknown hosting provider: ${provider}`);
}
