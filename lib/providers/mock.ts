import type { HostingProvider, ProviderCapability } from './types';

const capabilities: ProviderCapability[] = [
  'domain.search',
  'domain.register',
  'domain.renew',
  'domain.transfer',
  'domain.nameservers',
  'hosting.provision',
  'hosting.usage',
  'hosting.controlPanel',
  'email.mailbox',
  'email.webmail',
];

export const mockProvider: HostingProvider = {
  name: 'mock',
  capabilities,
  async searchDomain() { return { ok: true, data: { available: true } }; },
  async registerDomain({ domain }) { return { ok: true, data: { externalId: `mock-domain-${domain}` } }; },
  async renewDomain(domain) { return { ok: true, data: { externalId: `mock-domain-${domain}` } }; },
  async transferDomain({ domain }) { return { ok: true, data: { externalId: `mock-domain-${domain}` } }; },
  async getDomainNameservers() { return { ok: true, data: { nameservers: ['ns1.example.invalid', 'ns2.example.invalid'] } }; },
  async provisionHosting({ domain }) { return { ok: true, data: { externalId: `mock-hosting-${domain}` } }; },
  async getHostingUsage() { return { ok: true, data: { storageMb: 0, bandwidthMb: 0 } }; },
  async getControlPanelUrl(externalId) { return { ok: true, data: { url: `https://example.invalid/control-panel/${encodeURIComponent(externalId)}` } }; },
  async createMailbox({ domain, mailbox }) { return { ok: true, data: { externalId: `mock-mailbox-${mailbox}@${domain}` } }; },
  async getWebmailUrl() { return { ok: true, data: { url: 'https://example.invalid/webmail' } }; },
};
