import type { DomainProvider, EmailProvider, HostingProvider, ProviderResult } from './types';

/** Server-side provider adapter. No provider secret belongs in client code. */
export class WhoGoHostProvider implements DomainProvider, HostingProvider, EmailProvider {
  constructor(private readonly config: { apiBaseUrl: string; apiKey: string }) {}

  async search(_domain: string) { return this.notConfigured('domain_search'); }
  async register(_input: unknown) { return this.notConfigured('domain_register'); }
  async renew(_input: unknown) { return this.notConfigured('domain_renew'); }
  async transfer(_input: unknown) { return this.notConfigured('domain_transfer'); }
  async getDns(_domain: string) { return this.notConfigured('domain_dns'); }
  async saveDns(_domain: string, _records: unknown) { return this.notConfigured('domain_dns'); }
  async getNameservers(_domain: string) { return this.notConfigured('domain_nameservers'); }
  async saveNameservers(_domain: string, _nameservers: string[]) { return this.notConfigured('domain_nameservers'); }

  async provision(_input: unknown) { return this.notConfigured('hosting_provision'); }
  async suspend(_input: unknown) { return this.notConfigured('hosting_suspend'); }
  async getUsage(_input: unknown) { return this.notConfigured('hosting_usage'); }
  async getControlPanelAccess(_input: unknown) { return this.notConfigured('hosting_control_panel'); }

  async provisionMailbox(_input: unknown) { return this.notConfigured('email_provision'); }
  async getAccess(_input: unknown) { return this.notConfigured('email_access'); }

  private notConfigured<T>(capability: string): ProviderResult<T> {
    void this.config;
    return { ok: false, error: { code: 'PROVIDER_NOT_CONFIGURED', message: `WhoGoHost capability '${capability}' is not connected yet.` } };
  }
}
