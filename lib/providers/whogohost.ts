import { createHmac } from 'node:crypto';
import type { DomainRegistrationInput, HostingProvider, ProviderCapability, ProviderResult } from './types';
import { unsupported } from './types';

const endpoint = () => process.env.WHOGOHOST_API_BASE_URL || 'https://www.whogohost.com/host/modules/addons/DomainsReseller/api/index.php';
const username = () => process.env.WHOGOHOST_API_EMAIL?.trim();
const apiKey = () => process.env.WHOGOHOST_API_KEY?.trim();

function configured(): boolean {
  return Boolean(username() && apiKey());
}

function token(): string {
  const email = username();
  const key = apiKey();
  if (!email || !key) throw new Error('WhoGoHost reseller API credentials are missing.');
  const hour = new Date().toISOString().slice(0, 13).replace('T', ' ');
  return Buffer.from(createHmac('sha256', `${email}:${hour}`).update(key).digest('hex')).toString('base64');
}

function domainPath(domain: string, suffix: string): string {
  return `${endpoint().replace(/\/$/, '')}/domains/${encodeURIComponent(domain)}${suffix}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ProviderResult<T>> {
  if (!configured()) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost Domain Reseller API credentials are not configured.' };
  }
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        username: username()!,
        token: token(),
        ...(init.headers || {}),
      },
      cache: 'no-store',
    });
    const text = await response.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) {
      return { ok: false, code: 'PROVIDER_ERROR', message: `WhoGoHost returned HTTP ${response.status}.` };
    }
    return { ok: true, data: data as T };
  } catch (error) {
    return { ok: false, code: 'PROVIDER_ERROR', message: error instanceof Error ? error.message : 'WhoGoHost request failed.' };
  }
}

function resultExternalId(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['id', 'domainid', 'domainId', 'orderid', 'orderId', 'domain']) {
      if (typeof record[key] === 'string' || typeof record[key] === 'number') return String(record[key]);
    }
    if (record.data && typeof record.data === 'object') return resultExternalId(record.data, fallback);
  }
  return fallback;
}

const capabilities: ProviderCapability[] = [
  'domain.search',
  'domain.register',
  'domain.renew',
  'domain.transfer',
  'domain.nameservers',
];

export const whogohostProvider: HostingProvider = {
  name: 'whogohost',
  capabilities,

  async searchDomain(domain) {
    // WhoGoHost documents this as a reseller API action, but the current public
    // knowledgebase does not expose its exact route/parameters consistently.
    // Keep the route configurable rather than guessing and silently reporting
    // availability. Set WHOGOHOST_DOMAIN_AVAILABILITY_PATH after confirming it
    // in the reseller API documentation/account.
    const template = process.env.WHOGOHOST_DOMAIN_AVAILABILITY_PATH?.trim();
    if (!template) {
      return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost availability route is not configured. Set WHOGOHOST_DOMAIN_AVAILABILITY_PATH from the reseller API documentation.' };
    }
    const path = template.replace('{domain}', encodeURIComponent(domain));
    const result = await request<unknown>(`${endpoint().replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`);
    if (!result.ok) return result;
    const value = result.data && typeof result.data === 'object' ? result.data as Record<string, unknown> : {};
    const candidate = value.available ?? (value.data && typeof value.data === 'object' ? (value.data as Record<string, unknown>).available : undefined);
    if (typeof candidate !== 'boolean') return { ok: false, code: 'PROVIDER_ERROR', message: 'WhoGoHost availability response did not contain a boolean availability result.' };
    return { ok: true, data: { available: candidate } };
  },

  async registerDomain(input: DomainRegistrationInput) {
    const params = new URLSearchParams();
    params.set('domain', input.domain);
    params.set('regperiod', String(input.regperiod));
    input.nameservers.forEach((ns, index) => params.set(`nameservers[ns${index + 1}]`, ns));
    for (const [role, contact] of Object.entries(input.contacts)) {
      for (const [key, value] of Object.entries(contact)) params.set(`contacts[${role}][${key}]`, value);
    }
    const result = await request<unknown>(`${endpoint().replace(/\/$/, '')}/order/domains/register`, { method: 'POST', body: params.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    if (!result.ok) return result;
    return { ok: true, data: { externalId: resultExternalId(result.data, input.domain) } };
  },

  async renewDomain(domain, regperiod) {
    const params = new URLSearchParams({ domain, regperiod: String(regperiod) });
    const result = await request<unknown>(`${endpoint().replace(/\/$/, '')}/order/domains/renew`, { method: 'POST', body: params.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    if (!result.ok) return result;
    return { ok: true, data: { externalId: resultExternalId(result.data, domain) } };
  },

  async transferDomain(input) {
    const params = new URLSearchParams({ domain: input.domain, eppcode: input.eppcode, regperiod: String(input.regperiod) });
    input.nameservers.forEach((ns) => params.append('nameservers[]', ns));
    const result = await request<unknown>(`${endpoint().replace(/\/$/, '')}/order/domains/transfer`, { method: 'POST', body: params.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    if (!result.ok) return result;
    return { ok: true, data: { externalId: resultExternalId(result.data, input.domain) } };
  },

  async getDomainNameservers(domain) {
    const result = await request<unknown>(domainPath(domain, '/nameservers'));
    if (!result.ok) return result;
    const value = result.data && typeof result.data === 'object' ? result.data as Record<string, unknown> : {};
    const raw = value.nameservers ?? (value.data && typeof value.data === 'object' ? (value.data as Record<string, unknown>).nameservers : undefined);
    const nameservers = Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [];
    return { ok: true, data: { nameservers } };
  },

  async provisionHosting() { return unsupported('WhoGoHost hosting automation is not enabled by this domain reseller adapter.'); },
  async getHostingUsage() { return unsupported('WhoGoHost hosting usage is not exposed by the verified domain reseller API.'); },
  async getControlPanelUrl() { return unsupported('WhoGoHost hosting control-panel automation is not enabled by this adapter.'); },
  async createMailbox() { return unsupported('WhoGoHost mailbox automation is not enabled by this adapter.'); },
  async getWebmailUrl() { return unsupported('WhoGoHost webmail automation is not enabled by this adapter.'); },
};
