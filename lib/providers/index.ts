import { mockProvider } from './mock';
import { unconfiguredProvider } from './unconfigured';
import { whogohostProvider } from './whogohost';
import type { HostingProvider } from './types';

/**
 * Select the server-side provider. Provider credentials are never exposed to
 * the browser. Mock mode is explicit; live WhoGoHost mode uses the verified
 * domain-reseller adapter and leaves unsupported hosting operations disabled.
 */
export function getHostingProvider(): HostingProvider {
  const provider = (process.env.HOSTING_PROVIDER || 'unconfigured').toLowerCase();

  if (provider === 'mock') return mockProvider;
  if (provider === 'whogohost' || provider === 'go54') return whogohostProvider;
  if (provider === 'unconfigured') return unconfiguredProvider;

  throw new Error(`Unknown hosting provider: ${provider}`);
}
