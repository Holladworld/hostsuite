import { z } from 'zod';
import { getHostingProvider } from '../providers';
import { getHostingProviderStatus } from '../providers/registry';
import type { ProviderCapability } from '../providers/types';

const domainSchema = z.string().trim().toLowerCase().min(4).max(253).regex(
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
  'Enter a valid domain name.',
);

const contactSchema = z.object({
  firstname: z.string().trim().min(1).max(100),
  lastname: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phonenumber: z.string().trim().min(7).max(32),
  address1: z.string().trim().min(3).max(200),
  address2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  zipcode: z.string().trim().min(1).max(24),
  country: z.string().trim().min(2).max(56),
  companyname: z.string().trim().max(150).optional(),
}).strict();

const configSchema = z.object({
  serviceType: z.enum(['domain', 'hosting', 'email', 'website']).optional(),
  managementMode: z.enum(['self', 'hostsuite', 'help']).optional(),
  mode: z.enum(['existing', 'new']).optional(),
  domain: domainSchema.optional(),
  domainSource: z.enum(['existing', 'new']).optional(),
  searchQuery: z.string().trim().max(253).optional(),
  requestedDomain: domainSchema.optional(),
  domainContact: contactSchema.optional(),
  emailAddresses: z.array(z.string().trim().email().max(254)).max(25).optional(),
}).strict();

const provisionableTypes = new Set(['domain', 'hosting', 'email', 'website']);

export function validateCheckoutItemConfiguration(
  productType: string,
  quantity: number,
  rawMetadata: unknown,
): { ok: true; quantity: number; metadata: Record<string, unknown> } | { ok: false; error: string } {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
    return { ok: false, error: 'Quantity must be a whole number between 1 and 100.' };
  }
  if (['domain', 'hosting', 'email', 'website', 'managed_service'].includes(productType) && quantity !== 1) {
    return { ok: false, error: 'Services must be purchased one at a time.' };
  }

  if (!provisionableTypes.has(productType)) {
    if (rawMetadata && typeof rawMetadata === 'object' && Object.keys(rawMetadata).length > 0) {
      return { ok: false, error: 'This product does not accept customer-supplied fulfilment settings.' };
    }
    return { ok: true, quantity, metadata: {} };
  }

  const parsed = configSchema.safeParse(rawMetadata ?? {});
  if (!parsed.success) return { ok: false, error: 'The service configuration contains unsupported or invalid fields.' };
  const config = parsed.data;
  if (config.serviceType && config.serviceType !== productType) {
    return { ok: false, error: 'The selected service type does not match the product.' };
  }

  if (productType === 'domain') {
    const domain = config.domain ?? config.requestedDomain;
    if (!domain || !config.domainContact) {
      return { ok: false, error: 'Domain registration requires a valid domain and complete registrant details.' };
    }
    return {
      ok: true,
      quantity,
      metadata: {
        serviceType: 'domain',
        managementMode: config.managementMode ?? 'self',
        mode: 'new',
        domain,
        domainSource: 'new',
        requestedDomain: domain,
        domainContact: config.domainContact,
      },
    };
  }

  if (productType === 'hosting') {
    if (config.mode === 'new') return { ok: false, error: 'Register the domain first, or choose a domain you already own before purchasing hosting.' };
    if (!config.domain) return { ok: false, error: 'Hosting requires a valid domain name.' };
    return {
      ok: true,
      quantity,
      metadata: {
        serviceType: 'hosting',
        managementMode: config.managementMode ?? 'self',
        mode: config.mode ?? 'existing',
        domain: config.domain,
        domainSource: config.mode ?? 'existing',
      },
    };
  }

  if (productType === 'email') {
    if (config.mode === 'new') return { ok: false, error: 'Connect an existing domain before purchasing email. Domain registration must be completed separately.' };
    if (!config.domain || !config.emailAddresses?.length) {
      return { ok: false, error: 'Email setup requires a valid domain and at least one email address.' };
    }
    const domainPart = config.domain;
    if (config.emailAddresses.some((address) => address.split('@')[1]?.toLowerCase() !== domainPart)) {
      return { ok: false, error: 'Every email address must use the selected domain.' };
    }
    return {
      ok: true,
      quantity,
      metadata: {
        serviceType: 'email',
        managementMode: config.managementMode ?? 'self',
        domain: config.domain,
        emailAddresses: [...new Set(config.emailAddresses.map((address) => address.toLowerCase()))],
      },
    };
  }

  return {
    ok: true,
    quantity,
    metadata: {
      serviceType: 'website',
      managementMode: config.managementMode ?? 'self',
      ...(config.domain ? { domain: config.domain } : {}),
    },
  };
}

export function getCanonicalAppUrl(path: string): string {
  const configured = process.env.APP_BASE_URL;
  if (!configured) throw new Error('APP_BASE_URL_NOT_CONFIGURED');
  const base = new URL(configured);
  if (base.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new Error('APP_BASE_URL_MUST_USE_HTTPS');
  }
  return new URL(path, base).toString();
}

/** Verify domain availability server-side before creating a payable order. */
export async function verifyDomainAvailability(domain: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const provider = getHostingProvider();
  const result = await provider.searchDomain(domain);
  if (!result.ok) return { ok: false, error: result.message };
  if (!result.data.available) return { ok: false, error: 'This domain is no longer available. Search for another domain before continuing.' };
  return { ok: true };
}

/** Return a customer-safe reason when the configured supplier cannot fulfil this product. */
export function getCheckoutProviderBlock(productType: string): string | null {
  const requirements: Record<string, ProviderCapability[]> = {
    domain: ['domain.register', 'domain.search'],
    hosting: ['hosting.provision'],
    email: ['email.mailbox'],
  };
  if (productType === 'website') return 'Website deployment is not yet available for automated checkout.';
  const required = requirements[productType];
  if (!required) return 'This product does not yet have a verified online fulfilment workflow. Please contact HostSuite for assistance.';

  const status = getHostingProviderStatus();
  if (status.mode === 'unconfigured') return 'This service is not available for online purchase yet. Please contact HostSuite for assistance.';
  if (status.mode === 'mock' && process.env.NODE_ENV === 'production') return 'This service is not available for online purchase yet.';
  if (required.some((capability) => !status.supportedCapabilities.includes(capability)
    || !status.configurationSatisfiedCapabilities.includes(capability))) {
    return 'The configured supplier cannot currently fulfil this service online. Please contact HostSuite for assistance.';
  }
  if (productType === 'domain' && status.mode === 'live' && (!process.env.WHOGOHOST_DEFAULT_NS1?.trim() || !process.env.WHOGOHOST_DEFAULT_NS2?.trim())) {
    return 'Domain registration is temporarily unavailable while supplier nameservers are configured.';
  }
  return null;
}
