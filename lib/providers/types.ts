export type ProviderCapability =
  | 'domain_search'
  | 'domain_register'
  | 'domain_transfer'
  | 'domain_renew'
  | 'domain_contacts'
  | 'domain_dns'
  | 'domain_nameservers'
  | 'domain_email_forwarding'
  | 'hosting_provision'
  | 'hosting_suspend'
  | 'hosting_usage'
  | 'hosting_control_panel'
  | 'email_provision'
  | 'email_access'
  | 'ssl'
  | 'backups';

export type ProviderResult<T> = { ok: boolean; data?: T; error?: { code: string; message: string } };

export interface DomainProvider {
  search(domain: string): Promise<ProviderResult<unknown>>;
  register(input: unknown): Promise<ProviderResult<unknown>>;
  renew(input: unknown): Promise<ProviderResult<unknown>>;
  transfer(input: unknown): Promise<ProviderResult<unknown>>;
  getDns(domain: string): Promise<ProviderResult<unknown>>;
  saveDns(domain: string, records: unknown): Promise<ProviderResult<unknown>>;
  getNameservers(domain: string): Promise<ProviderResult<unknown>>;
  saveNameservers(domain: string, nameservers: string[]): Promise<ProviderResult<unknown>>;
}

export interface HostingProvider {
  provision(input: unknown): Promise<ProviderResult<unknown>>;
  suspend(input: unknown): Promise<ProviderResult<unknown>>;
  getUsage(input: unknown): Promise<ProviderResult<unknown>>;
  getControlPanelAccess(input: unknown): Promise<ProviderResult<unknown>>;
}

export interface EmailProvider {
  provisionMailbox(input: unknown): Promise<ProviderResult<unknown>>;
  getAccess(input: unknown): Promise<ProviderResult<unknown>>;
}

export const WHOGOHOST_CAPABILITIES_CONFIRMED: ProviderCapability[] = [
  'domain_search', 'domain_register', 'domain_transfer', 'domain_renew',
  'domain_contacts', 'domain_dns', 'domain_nameservers', 'domain_email_forwarding',
  'hosting_provision', 'hosting_control_panel',
];

export const WHOGOHOST_CAPABILITIES_UNVERIFIED: ProviderCapability[] = [
  'hosting_suspend', 'hosting_usage', 'email_provision', 'email_access', 'ssl', 'backups',
];
