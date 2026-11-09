import { describe, expect, it } from 'vitest';
import { getCheckoutProviderBlock, validateCheckoutItemConfiguration } from '../../lib/billing/checkout-validation';

describe('HostSuite checkout input validation', () => {
  it('rejects fractional and unbounded quantities', () => {
    expect(validateCheckoutItemConfiguration('other', 1.5, {})).toMatchObject({ ok: false });
    expect(validateCheckoutItemConfiguration('other', 101, {})).toMatchObject({ ok: false });
  });

  it('requires one unit for provisionable services', () => {
    expect(validateCheckoutItemConfiguration('hosting', 2, { domain: 'example.com' })).toMatchObject({ ok: false });
  });

  it('rejects browser attempts to override provider plan references', () => {
    expect(validateCheckoutItemConfiguration('hosting', 1, {
      domain: 'example.com',
      planRef: 'attacker-controlled-plan',
    })).toMatchObject({ ok: false });
  });

  it('normalizes and accepts a valid hosting configuration', () => {
    expect(validateCheckoutItemConfiguration('hosting', 1, {
      serviceType: 'hosting',
      managementMode: 'self',
      mode: 'existing',
      domain: 'Example.COM',
    })).toEqual({
      ok: true,
      quantity: 1,
      metadata: {
        serviceType: 'hosting',
        managementMode: 'self',
        mode: 'existing',
        domain: 'example.com',
        domainSource: 'existing',
      },
    });
  });

  it('does not sell hosting or email against a domain that has not been registered', () => {
    expect(validateCheckoutItemConfiguration('hosting', 1, {
      mode: 'new',
      domain: 'example.com',
    })).toMatchObject({ ok: false });
    expect(validateCheckoutItemConfiguration('email', 1, {
      mode: 'new',
      domain: 'example.com',
      emailAddresses: ['hello@example.com'],
    })).toMatchObject({ ok: false });
  });

  it('rejects mismatched service types and unknown configuration keys', () => {
    expect(validateCheckoutItemConfiguration('hosting', 1, {
      serviceType: 'domain',
      domain: 'example.com',
    })).toMatchObject({ ok: false });
    expect(validateCheckoutItemConfiguration('hosting', 1, {
      domain: 'example.com',
      isPaid: true,
    })).toMatchObject({ ok: false });
  });

  it('requires complete registrant details for domain registration', () => {
    expect(validateCheckoutItemConfiguration('domain', 1, {
      domain: 'example.com',
    })).toMatchObject({ ok: false });
  });

  it('requires email mailboxes to belong to the selected domain', () => {
    expect(validateCheckoutItemConfiguration('email', 1, {
      domain: 'example.com',
      emailAddresses: ['admin@other.com'],
    })).toMatchObject({ ok: false });
    expect(validateCheckoutItemConfiguration('email', 1, {
      domain: 'example.com',
      emailAddresses: ['admin@example.com'],
    })).toMatchObject({ ok: true });
  });

  it('blocks product categories without a verified online fulfilment workflow', () => {
    expect(getCheckoutProviderBlock('support')).toContain('verified online fulfilment');
    expect(getCheckoutProviderBlock('website')).toContain('Website deployment');
  });

  it('does not accept arbitrary fulfilment metadata for non-provisioning products', () => {
    expect(validateCheckoutItemConfiguration('support', 1, {})).toMatchObject({ ok: true, metadata: {} });
    expect(validateCheckoutItemConfiguration('support', 1, { serviceType: 'hosting' })).toMatchObject({ ok: false });
  });
});
