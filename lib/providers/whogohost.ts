import type { DomainProvider, EmailProvider, HostingProvider, ProviderResult } from './types';

/**
 * Server-side adapter boundary for WhoGoHost/GO54.
 *
 * Domain API capabilities are documented by the provider. Hosting/email
 * operations are intentionally left unimplemented until the reseller account
 * and the exact API/control-panel capabilities are verified.
 */
export class WhoGoHostProvider implements DomainProvider, HostingProvider, EmailProvider {
  constructor(private readonly config: { apiBaseUrl: string; apiKey: string }) {}

  async search(_domain: string): Promise<ProviderResult<unknown>> {
    return this.notConfigured('domain_search');
  }

  async register(_input: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('domain_register');
  }

  async renew(_input: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('domain_renew');
  }

  async transfer(_input: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('domain_transfer');
  }

  async getDns(_domain: string): Promise<ProviderResult<unknown>> {
    return this.notConfigured('domain_dns');
  }

  async saveDns(_domain: string, _records: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('domain_dns');
  }

  async getNameservers(_domain: string): Promise<ProviderResult<unknown>> {
    return this.notConfigured('domain_nameservers');
  }

  async saveNameservers(_domain: string, _nameservers: string[]): Promise<ProviderResult<unknown>> {
    return this.notConfigured('domain_nameservers');
  }

  async provision(_input: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('hosting_provision');
  }

  async suspend(_input: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('hosting_suspend');
  }

  async getUsage(_input: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('hosting_usage');
  }

  async getControlPanelAccess(_input: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('hosting_control_panel');
  }

  async provisionEmail(_input: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('email_provision');
  }

  async getAccess(_input: unknown): Promise<ProviderResult<unknown>> {
    return this.notConfigured('email_access');
  }

  private notConfigured(capability: string): ProviderResult<never> {
    void this.config;
    return {
      ok: false,
      error: {
        code: 'PROVIDER_NOT_CONFIGURED',
        message: `WhoGoHost capability '${capability}' is not connected yet. Configure and verify the provider adapter before enabling this operation.`,
      },
    };
  }
}
