import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { keywordGenerationSystemPrompt } from '../prompts/keyword';
import { LocaleCode } from '@/lib/utils/locale';
import { getLocaleName } from '@/lib/utils/locale';
import openai, { zodResponseFormat } from '@/lib/llm/openai';
import { z } from 'zod';
import { LlmRefusalError } from '@/types/errors';

const KeywordResponseSchema = z.object({
  keywords: z.array(z.string()),
});

export async function generateAsoKeywords(
  locale: LocaleCode,
  title: string,
  shortDescription: string
): Promise<string[]> {
  const messages = [
    { role: 'system', content: keywordGenerationSystemPrompt.trim() },
    {
      role: 'user',
      content: `Target app: "${title} (${shortDescription})"\nLocale: ${getLocaleName(locale)}`,
    },
  ] as ChatCompletionMessageParam[];

  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages,
    response_format: zodResponseFormat(KeywordResponseSchema, 'keywords'),
  });

  if (response.choices[0].message.refusal) {
    throw new LlmRefusalError(response.choices[0].message.refusal);
  }

  return response.choices[0].message.parsed?.keywords ?? [];
}
