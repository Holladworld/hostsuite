import { getAiBuilderProvider, type AiBuilderProvider } from './ai-builder';

export type AiBuilderProviderStatus = {
  provider: string;
  configured: boolean;
  capabilities: string[];
};

export function getRegisteredAiBuilderProvider(): AiBuilderProvider {
  return getAiBuilderProvider();
}

export function getAiBuilderProviderStatus(): AiBuilderProviderStatus {
  const provider = getAiBuilderProvider();
  return {
    provider: provider.name,
    configured: provider.configured,
    capabilities: [...provider.capabilities],
  };
}

export function hasAiBuilderCapability(capability: AiBuilderProvider['capabilities'][number]) {
  return getAiBuilderProvider().capabilities.includes(capability);
}
