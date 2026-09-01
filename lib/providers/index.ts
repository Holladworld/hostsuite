import { mockProvider } from './mock';
import type { HostingProvider } from './types';

/**
 * Selects the provider without exposing provider credentials to the browser.
 * Live WhoGoHost/Go54 provisioning is deliberately disabled until its reseller
 * API and account capabilities are verified.
 */
export function getHostingProvider(): HostingProvider {
  const provider = (process.env.HOSTING_PROVIDER || 'mock').toLowerCase();

  if (provider === 'mock') return mockProvider;

  if (provider === 'whogohost' || provider === 'go54') {
    throw new Error('WhoGoHost/Go54 provider is not enabled until its reseller API capabilities are verified.');
  }

  throw new Error(`Unknown hosting provider: ${provider}`);
}
