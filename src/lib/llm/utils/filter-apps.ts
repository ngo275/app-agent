import { AppStoreApp } from '@/types/app-store';
import { appFilteringSystemPrompt } from '@/lib/llm/prompts/keyword';
import openai, { zodResponseFormat } from '@/lib/llm/openai';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { z } from 'zod';
import { LlmRefusalError } from '@/types/errors';

const IndicesResponseSchema = z.object({
  reasoningSteps: z.array(z.string()),
  indices: z.array(z.number()),
});

// TODO: make it store agnostic
export async function filterApps(
  title: string,
  shortDescription: string,
  apps: Partial<AppStoreApp>[]
) {
  const messages = [
    { role: 'system', content: appFilteringSystemPrompt.trim() },
    {
      role: 'user',
      content: `- App Description: "${title} (${shortDescription})"\n- Potential Competitors List:\n${apps.map((app, i) => `  ${i + 1}. "${app.title} (${app.description?.slice(0, 200)}...)"`).join('\n')}`,
    },
  ] as ChatCompletionMessageParam[];

  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages,
    response_format: zodResponseFormat(IndicesResponseSchema, 'indices'),
  });

  if (response.choices[0].message.refusal) {
    throw new LlmRefusalError('The model refused to generate indices.');
  }

  const result = response.choices[0].message.parsed;
  const indices = result?.indices;
  return indices?.map((i) => apps[i - 1]) || [];
}
