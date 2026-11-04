import { getHostingProvider } from './index';
import type { HostingProvider, ProviderCapability } from './types';
import { getProviderConfiguration, type ProviderKind } from './config';

export type RegisteredProvider = {
  name: string;
  kind: ProviderKind;
  configured: boolean;
  capabilities: readonly ProviderCapability[];
};

export function getRegisteredHostingProvider(): HostingProvider {
  return getHostingProvider();
}

export function getHostingProviderRegistry(): RegisteredProvider {
  const provider = getHostingProvider();
  const config = getProviderConfiguration();
  return {
    name: provider.name,
    kind: config.kind,
    configured: config.configured,
    capabilities: provider.capabilities,
  };
}

export function hasProviderCapability(capability: ProviderCapability): boolean {
  return getHostingProvider().capabilities.includes(capability);
}

export function requireProviderCapability(capability: ProviderCapability): HostingProvider {
  const provider = getHostingProvider();
  if (!provider.capabilities.includes(capability)) {
    throw new Error(`Provider capability is unavailable: ${capability}`);
  }
  return provider;
}
