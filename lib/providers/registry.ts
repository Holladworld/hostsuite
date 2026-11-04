import { getHostingProvider } from './index';
import type { ProviderCapability } from './types';

export type ProviderMode = 'unconfigured' | 'mock' | 'live';

export type HostingProviderStatus = {
  provider: string;
  mode: ProviderMode;
  configured: boolean;
  supportedCapabilities: readonly ProviderCapability[];
  readyCapabilities: readonly ProviderCapability[];
};

/**
 * Reports configuration readiness only. This deliberately does not claim that
 * the provider API is reachable or healthy; a live probe belongs in a separate
 * operational check with a bounded timeout.
 */
export function getHostingProviderStatus(): HostingProviderStatus {
  const provider = getHostingProvider();
  const selected = (process.env.HOSTING_PROVIDER || 'unconfigured').trim().toLowerCase();

  if (selected === 'unconfigured') {
    return {
      provider: provider.name,
      mode: 'unconfigured',
      configured: false,
      supportedCapabilities: provider.capabilities,
      readyCapabilities: [],
    };
  }

  if (selected === 'mock') {
    return {
      provider: provider.name,
      mode: 'mock',
      configured: true,
      supportedCapabilities: provider.capabilities,
      readyCapabilities: provider.capabilities,
    };
  }

  const credentialsPresent = Boolean(
    process.env.WHOGOHOST_API_EMAIL?.trim() &&
    process.env.WHOGOHOST_API_KEY?.trim()
  );
  const availabilityRoutePresent = Boolean(process.env.WHOGOHOST_DOMAIN_AVAILABILITY_PATH?.trim());

  const readyCapabilities = credentialsPresent
    ? provider.capabilities.filter((capability) =>
        capability !== 'domain.search' || availabilityRoutePresent
      )
    : [];

  return {
    provider: provider.name,
    mode: 'live',
    configured: credentialsPresent && availabilityRoutePresent,
    supportedCapabilities: provider.capabilities,
    readyCapabilities,
  };
}

export function hasProviderCapability(capability: ProviderCapability): boolean {
  return getHostingProvider().capabilities.includes(capability);
}

export function requireProviderCapability(capability: ProviderCapability) {
  const provider = getHostingProvider();
  if (!provider.capabilities.includes(capability)) {
    throw new Error(`Provider capability is unavailable: ${capability}`);
  }
  return provider;
}
