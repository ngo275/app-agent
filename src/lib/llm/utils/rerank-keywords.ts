import openai, { zodResponseFormat } from '@/lib/llm/openai';
import { z } from 'zod';
import { keywordRerankingPrompt } from '@/lib/llm/prompts/keyword';
import { LlmRefusalError } from '@/types/errors';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { getLocaleName, LocaleCode } from '@/lib/utils/locale';
import { CompetitorKeyword } from '@/types/aso';

const KeywordResponseSchema = z.object({
  keywords: z.array(z.string()),
});

export async function rerankKeywords(
  title: string,
  shortDescription: string,
  locale: LocaleCode,
  keywords: CompetitorKeyword[]
) {
  const formattedKeywords = keywords
    .map(
      (keyword) =>
        `${keyword.keyword} (Used by ${keyword.competitors.length} competitor apps)`
    )
    .join(', ');
  const messages = [
    {
      role: 'system',
      content: keywordRerankingPrompt.render({ locale: getLocaleName(locale) }),
    },
    {
      role: 'user',
      content: `Here's the target app information:
App name: ${title}
App description: ${shortDescription}

Here are keywords of competitor apps: ${formattedKeywords}`,
    },
  ] as ChatCompletionMessageParam[];
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4.1-mini',
    messages,
    response_format: zodResponseFormat(KeywordResponseSchema, 'keywords'),
  });

  if (response.choices[0].message.refusal) {
    throw new LlmRefusalError('The model refused to rerank keywords.');
  }

  const result = response.choices[0].message.parsed;
  return result?.keywords || [];
}
