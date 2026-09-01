export type ProviderCapability =
  | 'domain.search'
  | 'domain.register'
  | 'domain.renew'
  | 'domain.transfer'
  | 'domain.dns'
  | 'domain.nameservers'
  | 'hosting.provision'
  | 'hosting.suspend'
  | 'hosting.unsuspend'
  | 'hosting.usage'
  | 'hosting.controlPanel'
  | 'email.mailbox'
  | 'email.passwordReset'
  | 'email.webmail'
  | 'email.health'
  | 'deployment.deploy'
  | 'deployment.status'
  | 'deployment.domain';

export type ProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: 'NOT_CONFIGURED' | 'NOT_SUPPORTED' | 'PROVIDER_ERROR'; message: string };

export interface HostingProvider {
  readonly name: string;
  readonly capabilities: readonly ProviderCapability[];

  searchDomain(domain: string): Promise<ProviderResult<{ available: boolean }>>;
  provisionHosting(input: { customerId: string; domain: string; planRef: string }): Promise<ProviderResult<{ externalId: string }>>;
  getHostingUsage(externalId: string): Promise<ProviderResult<{ storageMb?: number; bandwidthMb?: number }>>;
  getControlPanelUrl(externalId: string): Promise<ProviderResult<{ url: string }>>;
  createMailbox(input: { customerId: string; domain: string; mailbox: string }): Promise<ProviderResult<{ externalId: string }>>;
  getWebmailUrl(externalId: string): Promise<ProviderResult<{ url: string }>>;
}

export const unsupported = <T>(message: string): ProviderResult<T> => ({
  ok: false,
  code: 'NOT_SUPPORTED',
  message,
});
