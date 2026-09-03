import { getHostingProviderRegistry } from './registry';
import { getProviderConfiguration } from './config';

export function getProviderHealth() {
  const registry = getHostingProviderRegistry();
  const config = getProviderConfiguration();
  const missing: string[] = [];

  if (registry.kind === 'whogohost' || registry.kind === 'go54') {
    if (!config.apiBaseUrl) missing.push('WHOGOHOST_API_BASE_URL');
    if (!config.hasApiKey) missing.push('WHOGOHOST_API_KEY');
    if (!config.apiEmail) missing.push('WHOGOHOST_API_EMAIL');
  }

  return {
    provider: registry.name,
    kind: registry.kind,
    configured: registry.configured && missing.length === 0,
    capabilities: registry.capabilities,
    missingConfiguration: missing,
  };
}
