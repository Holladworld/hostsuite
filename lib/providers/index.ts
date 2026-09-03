import { mockProvider } from './mock';
import { whogohostProvider } from './whogohost';
import type { HostingProvider } from './types';

/**
 * Selects the provider without exposing provider credentials to the browser.
 * The WhoGoHost adapter is safe to load before credentials are configured;
 * unsupported/unconfigured operations return explicit provider errors.
 */
export function getHostingProvider(): HostingProvider {
  const provider = (process.env.HOSTING_PROVIDER || 'whogohost').toLowerCase();

  if (provider === 'mock') return mockProvider;
  if (provider === 'whogohost' || provider === 'go54') return whogohostProvider;

  throw new Error(`Unknown hosting provider: ${provider}`);
}
