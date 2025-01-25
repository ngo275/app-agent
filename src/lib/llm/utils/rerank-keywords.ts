import openai, { zodResponseFormat } from '@/lib/llm/openai';
import { z } from 'zod';
import { keywordRerankingSystemPrompt } from '@/lib/llm/prompts/keyword';
import { LlmRefusalError } from '@/types/errors';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { getLocaleName, LocaleCode } from '@/lib/utils/locale';

const KeywordResponseSchema = z.object({
  keywords: z.array(z.string()),
});

export async function rerankKeywords(
  title: string,
  shortDescription: string,
  locale: LocaleCode,
  keywords: string[]
) {
  const messages = [
    { role: 'system', content: keywordRerankingSystemPrompt.trim() },
    {
      role: 'user',
      content: `Target app: "${title} (${shortDescription})"\nLocale: ${getLocaleName(locale)}\nHere are keywords of competitor apps: ${keywords.join(', ')}`,
    },
  ] as ChatCompletionMessageParam[];
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    messages,
    response_format: zodResponseFormat(KeywordResponseSchema, 'keywords'),
  });

  if (response.choices[0].message.refusal) {
    throw new LlmRefusalError('The model refused to rerank keywords.');
  }

  const result = response.choices[0].message.parsed;
  return result?.keywords || [];
}
