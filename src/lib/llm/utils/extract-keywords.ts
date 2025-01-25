import {
  keywordExtractionFromTitleAndDescriptionSystemPrompt,
  keywordExtractionSystemPrompt,
} from '@/lib/llm/prompts/keyword';
import openai, { zodResponseFormat } from '@/lib/llm/openai';
import { z } from 'zod';
import { LlmRefusalError } from '@/types/errors';
import { getLocaleName, LocaleCode } from '@/lib/utils/locale';

const Step = z.object({
  explanation: z.string(),
  output: z.string(),
});

// const KeywordResponseSchema = z.object({
//   steps: z.array(Step),
//   answer: z.array(z.string()),
// });

const KeywordResponseSchema = z.object({
  keywords: z.array(z.string()),
});

export async function extractKeywords(...inputs: string[]) {
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: keywordExtractionSystemPrompt },
      { role: 'user', content: inputs.join('\n\n\n') },
    ],
    response_format: zodResponseFormat(KeywordResponseSchema, 'keywords'),
  });

  if (response.choices[0].message.refusal) {
    throw new LlmRefusalError('The model refused to generate keywords.');
  }

  const keywords = response.choices[0].message.parsed;

  return keywords;
}

// Note: subtitle (in App Store) is not available in the App Store API, so we need to use the description.
export async function extractKeywordsFromTitleAndDescription(
  title: string,
  description: string,
  locale: LocaleCode
) {
  if (!title || !description) {
    return [];
  }
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: keywordExtractionFromTitleAndDescriptionSystemPrompt.trim(),
      },
      {
        role: 'user',
        content: `Here's the target app informaion
Title: ${title}
Description: ${description.slice(0, 500)}
Locale: ${getLocaleName(locale)}`,
      },
    ],
    response_format: zodResponseFormat(KeywordResponseSchema, 'keywords'),
  });

  if (response.choices[0].message.refusal) {
    throw new LlmRefusalError('The model refused to generate keywords.');
  }

  const keywords = response.choices[0].message.parsed;

  return keywords?.keywords || [];
}
