import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import openai, { zodResponseFormat } from '@/lib/llm/openai';
import { keywordFinalSanityCheckPrompt } from '@/lib/llm/prompts/keyword';
import { z } from 'zod';
import { LlmRefusalError } from '@/types/errors';
import { getLocaleName, LocaleCode } from '@/lib/utils/locale';

const IndicesResponseSchema = z.object({
  indices: z.array(z.number()),
});

export const localeSanityCheck = async (
  locale: LocaleCode,
  keywords: string[]
) => {
  const keywordsString = keywords
    .map((keyword, i) => `  ${i + 1}. "${keyword}"`)
    .join('\n');
  const messages = [
    {
      role: 'system',
      content: keywordFinalSanityCheckPrompt.render({
        locale: getLocaleName(locale),
      }),
    },
    {
      role: 'user',
      content: `- Keywords: ${keywordsString}`,
    },
  ] as ChatCompletionMessageParam[];

  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    messages,
    response_format: zodResponseFormat(IndicesResponseSchema, 'indices'),
  });

  if (!response.choices[0].message.parsed) {
    throw new LlmRefusalError('No response from the model');
  }

  return response.choices[0].message.parsed.indices;
};

export const keywordFinalSanityCheck = async (
  locale: LocaleCode,
  keywords: string[]
) => {
  const keywordsString = keywords
    .map((keyword, i) => `  ${i + 1}. "${keyword}"`)
    .join('\n');
  const messages = [
    {
      role: 'system',
      content: keywordFinalSanityCheckPrompt.render({
        locale: getLocaleName(locale),
      }),
    },
    {
      role: 'user',
      content: `- Keywords: ${keywordsString}`,
    },
  ] as ChatCompletionMessageParam[];

  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    messages,
    response_format: zodResponseFormat(IndicesResponseSchema, 'indices'),
  });

  if (!response.choices[0].message.parsed) {
    throw new LlmRefusalError('No response from the model');
  }

  return response.choices[0].message.parsed.indices;
};
