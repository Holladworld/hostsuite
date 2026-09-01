// HostSuite product foundation
// Central product vocabulary for customer-facing flows and future provider adapters.

export const HOSTSUITE_SERVICE_KEYS = [
  'domain',
  'hosting',
  'website',
  'email',
  'ssl',
  'backup',
  'dns',
  'monitoring',
  'support',
  'managed_ops',
  'development',
  'ai_builder',
] as const;

export type HostSuiteServiceKey = (typeof HOSTSUITE_SERVICE_KEYS)[number];

export type ServiceMode = 'self_service' | 'managed' | 'hybrid';

export type ServiceLifecycle =
  | 'requested'
  | 'pending_payment'
  | 'provisioning'
  | 'active'
  | 'suspended'
  | 'cancelled'
  | 'failed';

export type ServiceCategory =
  | 'websites'
  | 'domains_email'
  | 'infrastructure'
  | 'support'
  | 'technology';

export type HostSuiteServiceDefinition = {
  key: HostSuiteServiceKey;
  category: ServiceCategory;
  name: string;
  description: string;
  supportsSelfService: boolean;
  supportsManaged: boolean;
};

export const HOSTSUITE_SERVICES: HostSuiteServiceDefinition[] = [
  {
    key: 'website',
    category: 'websites',
    name: 'Website',
    description: 'Build, connect, publish and manage your business website.',
    supportsSelfService: true,
    supportsManaged: true,
  },
  {
    key: 'hosting',
    category: 'infrastructure',
    name: 'Website Hosting',
    description: 'Reliable hosting with the tools you need to keep your website online.',
    supportsSelfService: true,
    supportsManaged: true,
  },
  {
    key: 'domain',
    category: 'domains_email',
    name: 'Domain',
    description: 'Register, connect and manage your business domain.',
    supportsSelfService: true,
    supportsManaged: true,
  },
  {
    key: 'email',
    category: 'domains_email',
    name: 'Business Email',
    description: 'Create and manage professional email addresses for your business.',
    supportsSelfService: true,
    supportsManaged: true,
  },
  {
    key: 'ssl',
    category: 'infrastructure',
    name: 'SSL Security',
    description: 'Keep your website connection secure and monitored.',
    supportsSelfService: true,
    supportsManaged: true,
  },
  {
    key: 'backup',
    category: 'infrastructure',
    name: 'Backups',
    description: 'Protect website data with scheduled backups and recovery support.',
    supportsSelfService: true,
    supportsManaged: true,
  },
  {
    key: 'dns',
    category: 'domains_email',
    name: 'DNS Management',
    description: 'Manage domain records and connections without leaving HostSuite.',
    supportsSelfService: true,
    supportsManaged: true,
  },
  {
    key: 'monitoring',
    category: 'infrastructure',
    name: 'Monitoring',
    description: 'Watch website availability, SSL, domains and supported services.',
    supportsSelfService: true,
    supportsManaged: true,
  },
  {
    key: 'support',
    category: 'support',
    name: 'Technical Support',
    description: 'Get guided help or hand a technical problem to HostSuite.',
    supportsSelfService: true,
    supportsManaged: true,
  },
  {
    key: 'managed_ops',
    category: 'support',
    name: 'Managed Web Operations',
    description: 'Let HostSuite manage your digital infrastructure for you.',
    supportsSelfService: false,
    supportsManaged: true,
  },
  {
    key: 'development',
    category: 'technology',
    name: 'Website & App Development',
    description: 'Build custom websites, applications, integrations and backend systems.',
    supportsSelfService: false,
    supportsManaged: true,
  },
  {
    key: 'ai_builder',
    category: 'websites',
    name: 'AI Website Builder',
    description: 'Create and publish a business website with guided AI assistance.',
    supportsSelfService: true,
    supportsManaged: true,
  },
];

export const SERVICE_CATEGORIES: Record<ServiceCategory, { name: string; description: string }> = {
  websites: {
    name: 'Websites',
    description: 'Build, publish and keep your website running.',
  },
  domains_email: {
    name: 'Domains & Email',
    description: 'Give your business a professional digital identity.',
  },
  infrastructure: {
    name: 'Infrastructure',
    description: 'Hosting, security, backups and monitoring.',
  },
  support: {
    name: 'Technical Support',
    description: 'Fix problems yourself or let HostSuite handle them.',
  },
  technology: {
    name: 'Business Technology',
    description: 'Custom technology for businesses that need more.',
  },
};

export type CustomerIntent =
  | 'need_website'
  | 'need_domain'
  | 'need_email'
  | 'need_hosting'
  | 'already_have_website'
  | 'technical_problem'
  | 'migration'
  | 'custom_technology'
  | 'not_sure';

export type ServiceAction = 'self_service' | 'managed_service' | 'guided_help';

export type ServiceDecision = {
  intent: CustomerIntent;
  recommendedServices: HostSuiteServiceKey[];
  nextAction: ServiceAction;
};

/**
 * Initial rules for the service-discovery flow.
 * Keep this deterministic so the UI can use it without an AI dependency.
 */
export function getServiceDecision(intent: CustomerIntent): ServiceDecision {
  switch (intent) {
    case 'need_website':
      return {
        intent,
        recommendedServices: ['website', 'ai_builder', 'domain', 'hosting', 'ssl', 'backup', 'monitoring'],
        nextAction: 'guided_help',
      };
    case 'need_domain':
      return { intent, recommendedServices: ['domain'], nextAction: 'self_service' };
    case 'need_email':
      return { intent, recommendedServices: ['domain', 'email'], nextAction: 'guided_help' };
    case 'need_hosting':
      return { intent, recommendedServices: ['hosting', 'ssl', 'backup', 'monitoring'], nextAction: 'self_service' };
    case 'already_have_website':
      return { intent, recommendedServices: ['hosting', 'domain', 'email', 'ssl', 'backup', 'monitoring'], nextAction: 'guided_help' };
    case 'technical_problem':
      return { intent, recommendedServices: ['monitoring', 'support'], nextAction: 'guided_help' };
    case 'migration':
      return { intent, recommendedServices: ['hosting', 'backup', 'domain', 'ssl'], nextAction: 'managed_service' };
    case 'custom_technology':
      return { intent, recommendedServices: ['development', 'managed_ops'], nextAction: 'managed_service' };
    case 'not_sure':
    default:
      return { intent: 'not_sure', recommendedServices: ['support'], nextAction: 'guided_help' };
  }
}

/**
 * Provider abstraction boundary. Provider-specific implementation belongs outside
 * the customer-facing product model (e.g. Whogohost/Go54 adapter later).
 */
export type HostingProvider = 'whogohost' | 'go54' | 'other' | 'manual';

export type ProviderServiceRef = {
  provider: HostingProvider;
  externalId: string;
  externalStatus?: string;
};

export type HostSuiteServiceInstance = {
  id: string;
  userId: string;
  service: HostSuiteServiceKey;
  mode: ServiceMode;
  lifecycle: ServiceLifecycle;
  providerRef?: ProviderServiceRef;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
