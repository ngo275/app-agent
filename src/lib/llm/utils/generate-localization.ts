import { getLocaleName, LocaleCode } from '@/lib/utils/locale';
import { systemPrompt, userPrompt } from '../prompts/localization';
import openai from '@/lib/llm/openai';

export async function generateLocalizations(
  whatsNew: string,
  locale: LocaleCode,
  appName: string,
  appVersion: string,
  appKeywords: string,
  reference?: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      {
        role: 'system',
        content: systemPrompt
          .render({
            locale: getLocaleName(locale),
            appName,
            appVersion,
            appKeywords,
          })
          .trim(),
      },
      {
        role: 'user',
        content: userPrompt
          .render({ locale: getLocaleName(locale), whatsNew, reference })
          .trim(),
      },
    ],
  });

  return (response.choices[0].message.content || whatsNew)
    .trim()
    .replace(/\n\n/g, '\n')
    .replace(/\*\*/g, '')
    .replace(/### /g, '')
    .replace(/## /g, '');
}
