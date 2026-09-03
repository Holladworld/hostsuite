export type AiBuilderCapability = 'project.create' | 'project.generate' | 'project.preview' | 'project.deploy';

export type AiBuilderProjectInput = {
  name: string;
  businessName: string;
  businessType: string;
  description: string;
  location?: string;
  services?: string[];
  style?: string;
};

export type AiBuilderProvider = {
  name: string;
  configured: boolean;
  capabilities: AiBuilderCapability[];
  createProject(input: AiBuilderProjectInput): Promise<{ externalProjectId?: string }>;
};

const capabilities: AiBuilderCapability[] = ['project.create'];

const unconfiguredProvider: AiBuilderProvider = {
  name: 'unconfigured',
  configured: false,
  capabilities,
  async createProject() {
    throw new Error('AI website builder is not configured in this environment.');
  },
};

export function getAiBuilderProvider(): AiBuilderProvider {
  const provider = (process.env.AI_BUILDER_PROVIDER ?? 'unconfigured').trim().toLowerCase();

  // OpenThorn is intentionally kept behind this adapter. Its deployment/API contract
  // must be configured explicitly before HostSuite sends customer data or generation jobs.
  if (provider === 'openthorn' && process.env.OPENTHORN_BASE_URL) {
    return {
      name: 'openthorn',
      configured: true,
      capabilities,
      async createProject() {
        // No guessed OpenThorn endpoint: project persistence is HostSuite-owned until
        // an authenticated, versioned OpenThorn API contract is configured.
        throw new Error('OpenThorn provider is configured but project API integration is not enabled yet.');
      },
    };
  }

  return unconfiguredProvider;
}

export function getAiBuilderStatus() {
  const provider = getAiBuilderProvider();
  return {
    provider: provider.name,
    configured: provider.configured,
    capabilities: provider.capabilities,
  };
}
