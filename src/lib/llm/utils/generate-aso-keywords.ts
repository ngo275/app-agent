import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { LocaleCode } from '@/lib/utils/locale';
import { getLocaleName } from '@/lib/utils/locale';
import openai, { zodResponseFormat } from '@/lib/llm/openai';
import { z } from 'zod';
import { LlmRefusalError } from '@/types/errors';
import { keywordGenerationUserPrompt } from '@/lib/llm/prompts/keyword';

const KeywordResponseSchema = z.object({
  keywords: z.array(z.string()),
});

export async function generateAsoKeywords(
  locale: LocaleCode,
  title: string,
  shortDescription: string
): Promise<string[]> {
  const messages = [
    {
      role: 'system',
      content: keywordGenerationUserPrompt.render({
        locale: getLocaleName(locale),
      }),
    },
    {
      role: 'user',
      content: `Here's the target app information:
Title: "${title}"
Description: "${shortDescription}"
Locale: ${getLocaleName(locale)}`,
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
