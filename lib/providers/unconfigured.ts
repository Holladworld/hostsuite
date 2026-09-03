import type { HostingProvider, ProviderCapability, ProviderResult } from './types';

const notConfigured = <T>(operation: string): ProviderResult<T> => ({
  ok: false,
  code: 'NOT_CONFIGURED',
  message: `${operation} is not configured. Connect the required reseller/provider automation before provisioning live services.`,
});

const capabilities: ProviderCapability[] = [];

export const unconfiguredProvider: HostingProvider = {
  name: 'unconfigured',
  capabilities,
  async searchDomain() { return notConfigured('Domain availability'); },
  async registerDomain() { return notConfigured('Domain registration'); },
  async renewDomain() { return notConfigured('Domain renewal'); },
  async transferDomain() { return notConfigured('Domain transfer'); },
  async getDomainNameservers() { return notConfigured('Domain nameservers'); },
  async provisionHosting() { return notConfigured('Hosting provisioning'); },
  async getHostingUsage() { return notConfigured('Hosting usage'); },
  async getControlPanelUrl() { return notConfigured('Hosting control panel'); },
  async createMailbox() { return notConfigured('Email provisioning'); },
  async getWebmailUrl() { return notConfigured('Webmail'); },
};
