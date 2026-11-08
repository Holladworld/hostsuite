export type AIProviderResponse = {
  content: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generate(input: { system: string; prompt: string; temperature?: number }): Promise<AIProviderResponse>;
}

export function getAIProvider(): AIProvider {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const providerName = process.env.AI_PROVIDER || 'openai-compatible';

  if (!apiKey || !model) {
    throw new Error('AI provider is not configured. Set AI_API_KEY and AI_MODEL on the server.');
  }

  return {
    name: providerName,
    model,
    async generate({ system, prompt, temperature = 0.7 }) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        const providerText = await response.text();
        console.error('AI provider error:', response.status, providerText.slice(0, 500));
        throw new Error('AI provider request failed.');
      }

      const result = await response.json();
      const content = result?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('AI provider returned no text content.');

      return {
        content,
        usage: result?.usage
          ? {
              inputTokens: result.usage.prompt_tokens,
              outputTokens: result.usage.completion_tokens,
              totalTokens: result.usage.total_tokens,
            }
          : undefined,
      };
    },
  };
}
