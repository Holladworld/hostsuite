import { createHmac } from 'node:crypto';
import type { DomainRegistrationInput, HostingProvider, ProviderCapability, ProviderResult } from './types';
import { unsupported } from './types';

const endpoint = () => process.env.WHOGOHOST_API_BASE_URL || 'https://www.whogohost.com/host/modules/addons/DomainsReseller/api/index.php';
const username = () => process.env.WHOGOHOST_API_EMAIL?.trim();
const apiKey = () => process.env.WHOGOHOST_API_KEY?.trim();
function configured(): boolean { return Boolean(username() && apiKey()); }

function token(): string {
  const email = username();
  const key = apiKey();
  if (!email || !key) throw new Error('WhoGoHost reseller API credentials are missing.');
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const hour = `${yy}-${mm}-${dd} ${hh}`;
  return Buffer.from(createHmac('sha256', key).update(`${email}:${hour}`).digest('hex')).toString('base64');
}

function baseUrl(): string { return endpoint().replace(/\/$/, ''); }
function domainPath(domain: string, suffix: string): string { return `${baseUrl()}/domains/${encodeURIComponent(domain)}${suffix}`; }

async function request<T>(path: string, init: RequestInit = {}): Promise<ProviderResult<T>> {
  if (!configured()) return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost Domain Reseller API credentials are not configured.' };
  try {
    const headers = new Headers(init.headers);
    headers.set('username', username()!);
    headers.set('token', token());
    const response = await fetch(path, { ...init, headers, cache: 'no-store' });
    const text = await response.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) return { ok: false, code: 'PROVIDER_ERROR', message: `WhoGoHost returned HTTP ${response.status}.` };
    return { ok: true, data: data as T };
  } catch (error) {
    return { ok: false, code: 'PROVIDER_ERROR', message: error instanceof Error ? error.message : 'WhoGoHost request failed.' };
  }
}

function record(data: unknown): Record<string, unknown> {
  return data && typeof data === 'object' ? data as Record<string, unknown> : {};
}
function nestedData(data: unknown): Record<string, unknown> {
  const value = record(data);
  return value.data && typeof value.data === 'object' ? value.data as Record<string, unknown> : value;
}
function resultExternalId(data: unknown, fallback: string): string {
  const value = record(data);
  for (const key of ['id', 'domainid', 'domainId', 'orderid', 'orderId', 'domain']) {
    if (typeof value[key] === 'string' || typeof value[key] === 'number') return String(value[key]);
  }
  if (value.data && typeof value.data === 'object') return resultExternalId(value.data, fallback);
  return fallback;
}
function booleanValue(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'locked', 'active', 'enabled'].includes(normalized)) return true;
    if (['false', '0', 'unlocked', 'inactive', 'disabled'].includes(normalized)) return false;
  }
  return null;
}

const capabilities: ProviderCapability[] = ['domain.search', 'domain.register', 'domain.renew', 'domain.transfer', 'domain.nameservers', 'domain.epp', 'domain.lock'];

export const whogohostProvider: HostingProvider = {
  name: 'whogohost',
  capabilities,

  async searchDomain(domain) {
    const template = process.env.WHOGOHOST_DOMAIN_AVAILABILITY_PATH?.trim();
    if (!template) return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost availability route is not configured. Set WHOGOHOST_DOMAIN_AVAILABILITY_PATH from the reseller API documentation.' };
    const path = template.replace('{domain}', encodeURIComponent(domain));
    const result = await request<unknown>(`${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`);
    if (!result.ok) return result;
    const value = nestedData(result.data);
    const candidate = value.available;
    if (typeof candidate !== 'boolean') return { ok: false, code: 'PROVIDER_ERROR', message: 'WhoGoHost availability response did not contain a boolean availability result.' };
    return { ok: true, data: { available: candidate } };
  },

  async registerDomain(input: DomainRegistrationInput) {
    const params = new URLSearchParams();
    params.set('domain', input.domain);
    params.set('regperiod', String(input.regperiod));
    input.nameservers.forEach((ns, index) => params.set(`nameservers[ns${index + 1}]`, ns));
    for (const [role, contact] of Object.entries(input.contacts)) for (const [key, value] of Object.entries(contact)) params.set(`contacts[${role}][${key}]`, value);
    const result = await request<unknown>(`${baseUrl()}/order/domains/register`, { method: 'POST', body: params.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    if (!result.ok) return result;
    return { ok: true, data: { externalId: resultExternalId(result.data, input.domain) } };
  },

  async renewDomain(domain, regperiod) {
    const params = new URLSearchParams({ domain, regperiod: String(regperiod) });
    const result = await request<unknown>(`${baseUrl()}/order/domains/renew`, { method: 'POST', body: params.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    if (!result.ok) return result;
    return { ok: true, data: { externalId: resultExternalId(result.data, domain) } };
  },

  async transferDomain(input) {
    const params = new URLSearchParams({ domain: input.domain, eppcode: input.eppcode, regperiod: String(input.regperiod) });
    input.nameservers.forEach((ns, index) => params.set(`nameservers[${index}]`, ns));
    const result = await request<unknown>(`${baseUrl()}/order/domains/transfer`, { method: 'POST', body: params.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    if (!result.ok) return result;
    return { ok: true, data: { externalId: resultExternalId(result.data, input.domain) } };
  },

  async getDomainNameservers(domain) {
    const result = await request<unknown>(domainPath(domain, '/nameservers'));
    if (!result.ok) return result;
    const value = nestedData(result.data);
    const raw = value.nameservers;
    const nameservers = Array.isArray(raw) ? raw.flatMap((item) => {
      if (typeof item === 'string') return [item];
      if (item && typeof item === 'object') {
        const candidate = (item as Record<string, unknown>).nameserver ?? (item as Record<string, unknown>).value;
        return typeof candidate === 'string' ? [candidate] : [];
      }
      return [];
    }) : [];
    return { ok: true, data: { nameservers } };
  },

  async updateDomainNameservers(domain, nameservers) {
    if (nameservers.length < 2 || nameservers.length > 5) return { ok: false, code: 'PROVIDER_ERROR', message: 'WhoGoHost requires at least two nameservers and supports up to five.' };
    const params = new URLSearchParams({ domain });
    nameservers.forEach((ns, index) => params.set(`nameservers[${index}]`, ns));
    const result = await request<unknown>(domainPath(domain, '/nameservers'), { method: 'POST', body: params.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    if (!result.ok) return result;
    return { ok: true, data: { nameservers } };
  },

  async getDomainEppCode(domain) {
    const result = await request<unknown>(domainPath(domain, '/eppcode'));
    if (!result.ok) return result;
    const value = nestedData(result.data);
    const eppcode = value.eppcode ?? value.eppCode ?? value.code;
    if (typeof eppcode !== 'string' || !eppcode.trim()) return { ok: false, code: 'PROVIDER_ERROR', message: 'WhoGoHost did not return an EPP code.' };
    return { ok: true, data: { eppcode } };
  },

  async getDomainLock(domain) {
    const result = await request<unknown>(domainPath(domain, '/lock'));
    if (!result.ok) return result;
    const value = nestedData(result.data);
    const candidate = booleanValue(value.locked ?? value.lockstatus ?? value.lockStatus ?? value.status);
    if (candidate === null) return { ok: false, code: 'PROVIDER_ERROR', message: 'WhoGoHost registrar-lock response could not be interpreted.' };
    return { ok: true, data: { locked: candidate } };
  },

  async updateDomainLock(domain, locked) {
    const params = new URLSearchParams({ domain, lockstatus: String(locked) });
    const result = await request<unknown>(domainPath(domain, '/lock'), { method: 'POST', body: params.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    if (!result.ok) return result;
    return { ok: true, data: { locked } };
  },

  async provisionHosting() { return unsupported('WhoGoHost hosting automation is not enabled by this domain reseller adapter.'); },
  async getHostingUsage() { return unsupported('WhoGoHost hosting usage is not exposed by the verified domain reseller API.'); },
  async getControlPanelUrl() { return unsupported('WhoGoHost hosting control-panel automation is not enabled by this adapter.'); },
  async createMailbox() { return unsupported('WhoGoHost mailbox automation is not enabled by this adapter.'); },
  async getWebmailUrl() { return unsupported('WhoGoHost webmail automation is not enabled by this adapter.'); },
};
