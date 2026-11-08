export type ProviderCapability =
  | 'domain.search'
  | 'domain.register'
  | 'domain.renew'
  | 'domain.transfer'
  | 'domain.dns'
  | 'domain.nameservers'
  | 'domain.epp'
  | 'domain.lock'
  | 'domain.contacts'
  | 'hosting.provision'
  | 'hosting.suspend'
  | 'hosting.unsuspend'
  | 'hosting.usage'
  | 'hosting.controlPanel'
  | 'email.mailbox'
  | 'email.passwordReset'
  | 'email.webmail'
  | 'email.health'
  | 'deployment.deploy'
  | 'deployment.status'
  | 'deployment.domain';

export type ProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: 'NOT_CONFIGURED' | 'NOT_SUPPORTED' | 'PROVIDER_ERROR'; message: string };

export type DomainContact = {
  firstname: string;
  lastname: string;
  fullname?: string;
  companyname?: string;
  email: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phonenumber: string;
};

export type DomainRegistrationInput = {
  domain: string;
  regperiod: number;
  nameservers: string[];
  contacts: {
    registrant: DomainContact;
    admin: DomainContact;
    tech: DomainContact;
    billing: DomainContact;
  };
};

export interface HostingProvider {
  readonly name: string;
  readonly capabilities: readonly ProviderCapability[];

  searchDomain(domain: string): Promise<ProviderResult<{ available: boolean }>>;
  registerDomain(input: DomainRegistrationInput): Promise<ProviderResult<{ externalId: string }>>;
  renewDomain(domain: string, regperiod: number): Promise<ProviderResult<{ externalId: string }>>;
  transferDomain(input: { domain: string; eppcode: string; regperiod: number; nameservers: string[] }): Promise<ProviderResult<{ externalId: string }>>;
  getDomainNameservers(domain: string): Promise<ProviderResult<{ nameservers: string[] }>>;
  updateDomainNameservers(domain: string, nameservers: string[]): Promise<ProviderResult<{ nameservers: string[] }>>;
  getDomainEppCode(domain: string): Promise<ProviderResult<{ eppcode: string }>>;
  getDomainLock(domain: string): Promise<ProviderResult<{ locked: boolean }>>;
  updateDomainLock(domain: string, locked: boolean): Promise<ProviderResult<{ locked: boolean }>>;
  provisionHosting(input: { customerId: string; domain: string; planRef: string }): Promise<ProviderResult<{ externalId: string }>>;
  getHostingUsage(externalId: string): Promise<ProviderResult<{ storageMb?: number; bandwidthMb?: number }>>;
  getControlPanelUrl(externalId: string): Promise<ProviderResult<{ url: string }>>;
  createMailbox(input: { customerId: string; domain: string; mailbox: string }): Promise<ProviderResult<{ externalId: string }>>;
  getWebmailUrl(externalId: string): Promise<ProviderResult<{ url: string }>>;
}

export const unsupported = <T>(message: string): ProviderResult<T> => ({
  ok: false,
  code: 'NOT_SUPPORTED',
  message,
});
