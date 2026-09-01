import type { HostingProvider, ProviderCapability, ProviderResult } from './types';

const capabilities: ProviderCapability[] = [
  'domain.search',
  'hosting.provision',
  'hosting.usage',
  'hosting.controlPanel',
  'email.mailbox',
  'email.webmail',
];

export const mockProvider: HostingProvider = {
  name: 'mock',
  capabilities,
  async searchDomain() {
    return { ok: true, data: { available: true } };
  },
  async provisionHosting({ domain }) {
    return { ok: true, data: { externalId: `mock-hosting-${domain}` } };
  },
  async getHostingUsage() {
    return { ok: true, data: { storageMb: 0, bandwidthMb: 0 } };
  },
  async getControlPanelUrl(externalId) {
    return { ok: true, data: { url: `https://example.invalid/control-panel/${encodeURIComponent(externalId)}` } };
  },
  async createMailbox({ domain, mailbox }) {
    return { ok: true, data: { externalId: `mock-mailbox-${mailbox}@${domain}` } };
  },
  async getWebmailUrl() {
    return { ok: true, data: { url: 'https://example.invalid/webmail' } };
  },
};
