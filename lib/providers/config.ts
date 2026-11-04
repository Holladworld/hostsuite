export type ProviderKind = 'unconfigured' | 'mock' | 'whogohost' | 'go54';

const SUPPORTED_PROVIDERS: readonly ProviderKind[] = ['unconfigured', 'mock', 'whogohost', 'go54'];

function env(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getHostingProviderKind(): ProviderKind {
  const configured = env('HOSTING_PROVIDER')?.toLowerCase() ?? 'unconfigured';
  return SUPPORTED_PROVIDERS.includes(configured as ProviderKind) ? configured as ProviderKind : 'unconfigured';
}

export function getProviderConfiguration() {
  const kind = getHostingProviderKind();
  return {
    kind,
    configured: kind !== 'unconfigured',
    apiBaseUrl: env('WHOGOHOST_API_BASE_URL'),
    hasApiKey: Boolean(env('WHOGOHOST_API_KEY')),
    apiEmail: env('WHOGOHOST_API_EMAIL'),
    domainAvailabilityPathConfigured: Boolean(env('WHOGOHOST_DOMAIN_AVAILABILITY_PATH')),
    defaultNameserversConfigured: Boolean(env('WHOGOHOST_DEFAULT_NS1') && env('WHOGOHOST_DEFAULT_NS2')),
  };
}

export function assertKnownProviderConfiguration() {
  const raw = env('HOSTING_PROVIDER');
  if (raw && !SUPPORTED_PROVIDERS.includes(raw.toLowerCase() as ProviderKind)) {
    throw new Error(`Unsupported HOSTING_PROVIDER: ${raw}`);
  }
}
