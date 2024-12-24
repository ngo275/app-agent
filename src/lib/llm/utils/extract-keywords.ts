import { keywordExtractionSystemPrompt } from '@/lib/llm/prompts/keyword';
import openai, { zodResponseFormat } from '@/lib/llm/openai';
import { z } from 'zod';
import { LlmRefusalError } from '@/types/errors';

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
    // store: true,
    // tags: ['extract-keywords'],
  });

  if (response.choices[0].message.refusal) {
    throw new LlmRefusalError('The model refused to generate keywords.');
  }

  const keywords = response.choices[0].message.parsed;

  return keywords;
}
