import crypto from 'node:crypto';
import type { HostingProvider, ProviderCapability, ProviderResult } from './types';

const DOMAIN_API = 'https://www.whogohost.com/host/modules/addons/DomainsReseller/api/index.php';

const capabilities: ProviderCapability[] = [
  'domain.search',
  'domain.register',
  'domain.renew',
  'domain.transfer',
  'domain.dns',
  'domain.nameservers',
  'hosting.provision',
  'hosting.usage',
  'hosting.controlPanel',
  'email.mailbox',
  'email.passwordReset',
  'email.webmail',
  'email.health',
];

function configError(): ProviderResult<never> {
  return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost provider credentials are not configured.' };
}

function token() {
  const apiKey = process.env.WHOGOHOST_API_KEY;
  const email = process.env.WHOGOHOST_API_EMAIL;
  if (!apiKey || !email) return null;
  const hour = new Date().toISOString().slice(0, 13).replace('T', ' ');
  return {
    username: email,
    token: Buffer.from(crypto.createHmac('sha256', apiKey).update(`${email}:${hour}`).digest('hex')).toString('base64'),
  };
}

async function domainRequest(action: string, params: Record<string, string>) {
  const auth = token();
  if (!auth) return configError();
  try {
    const response = await fetch(`${DOMAIN_API}${action}`, {
      method: 'POST',
      headers: {
        username: auth.username,
        token: auth.token,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, code: 'PROVIDER_ERROR' as const, message: 'WhoGoHost domain API request failed.' };
    return { ok: true as const, data };
  } catch {
    return { ok: false as const, code: 'PROVIDER_ERROR' as const, message: 'Unable to reach the WhoGoHost domain API.' };
  }
}

export const whogohostProvider: HostingProvider = {
  name: 'whogohost',
  capabilities,

  async searchDomain(domain) {
    const result = await domainRequest('/order/domains/checkavailability', { domain });
    if (!result.ok) return result;
    const available = Boolean(result.data?.data?.available ?? result.data?.available);
    return { ok: true, data: { available } };
  },

  async provisionHosting() {
    // WhoGoHost reseller hosting is managed through the reseller's WHM/DirectAdmin
    // environment. Keep this method server-side until HostSuite's reseller account
    // supplies the supported automation endpoint/credentials.
    return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost hosting provisioning is not enabled until reseller automation access is configured.' };
  },

  async getHostingUsage() {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost hosting usage access is not configured.' };
  },

  async getControlPanelUrl() {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost control-panel URL lookup is not configured.' };
  },

  async createMailbox() {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost mailbox provisioning is not enabled until reseller automation access is configured.' };
  },

  async getWebmailUrl() {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'WhoGoHost webmail access is not configured.' };
  },
};
