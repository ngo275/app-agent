import { AsoKeyword, AsoTarget, Store } from '@/types/aso';
import { systemPrompt, userPrompt } from '../prompts/optimization';
import openai, { zodResponseFormat } from '@/lib/llm/openai';
import { z } from 'zod';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { LlmRefusalError } from '@/types/errors';
import { getLocaleName, LocaleCode } from '@/lib/utils/locale';

// TODO: check the max length of keywords. This is also mentioned in the prompt.
const ContentsResponseSchemaForAppStore = z.object({
  title: z
    .string()
    .describe(
      'The title of the app. Max length is 30 characters. Keep the original app title as is and append keywords as a tag line if possible. Put as many characters as possible up to the limit.'
    )
    .optional(),
  subtitle: z
    .string()
    .describe(
      'The subtitle of the app. Max length is 30 characters. Put as many characters as possible up to the limit.'
    )
    .optional(),
  description: z
    .string()
    .describe(
      'The description of the app. Max length is 4000 characters. Incorporate the target keywords into the description naturally as frequent as possible to increase the keyword density. Aim to use the target keywords 6 times or more in the description for each keyword. Especially, the first 3 target keywords must be used as frequently as possible (at least 6 times). Use up the max length of the description field. The longer the better up to the limit.'
    )
    .optional(),
  // keywords: z.string().optional(),
});

const ContentsResponseSchemaForGooglePlay = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
});

export async function generateContents(
  locale: LocaleCode,
  title: string,
  asoKeywords: AsoKeyword[],
  targets: AsoTarget[],
  subtitle?: string,
  currentDescription?: string,
  descriptionOutline?: string,
  retry?: {
    prev: string;
    feedback: string;
  },
  store: Store = 'APPSTORE'
): Promise<
  typeof store extends 'APPSTORE'
    ? z.infer<typeof ContentsResponseSchemaForAppStore>
    : z.infer<typeof ContentsResponseSchemaForGooglePlay>
> {
  const formattedAsoKeywords = asoKeywords
    .map((keyword) =>
      keyword.position && keyword.position > 0
        ? `"${keyword.keyword}" (rank #${keyword.position})`
        : `"${keyword.keyword}"`
    )
    .join(', ');
  const targetContents = targets.join(', ');
  const forTitle = targets.includes(AsoTarget.title);
  const forSubtitle = targets.includes(AsoTarget.subtitle);
  const forDescription = targets.includes(AsoTarget.description);
  const messages = [
    {
      role: 'system',
      content: systemPrompt
        .render({
          locale: getLocaleName(locale),
          appStore: store === 'APPSTORE',
          forTitle,
          forSubtitle,
          forDescription,
          targetContents,
        })
        .trim(),
    },
    {
      role: 'user',
      content: userPrompt
        .render({
          title,
          subtitle,
          currentDescription,
          descriptionOutline,
          asoKeywords: formattedAsoKeywords,
          targetContents,
        })
        .trim(),
    },
  ] as ChatCompletionMessageParam[];

  if (retry?.prev && retry?.feedback) {
    messages.push({
      role: 'assistant',
      content: retry.prev,
    });
    messages.push({
      role: 'user',
      content: retry.feedback,
    });
  }

  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages,
    response_format:
      store === 'APPSTORE'
        ? zodResponseFormat(ContentsResponseSchemaForAppStore, 'contents')
        : zodResponseFormat(ContentsResponseSchemaForGooglePlay, 'contents'),
  });

  if (response.choices[0].message.refusal) {
    throw new LlmRefusalError('The model refused to generate contents.');
  }

  const result = response.choices[0].message.parsed;
  return result || {};
}
