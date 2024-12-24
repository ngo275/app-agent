import openai from '@/lib/llm/openai';
import { shortDescriptionSystemPrompt } from '../prompts/short-description';
import { shortDescriptionUserPrompt } from '../prompts/short-description';

export async function generateShortDescription(
  title: string,
  description: string
) {
  const systemPrompt = shortDescriptionSystemPrompt.trim();
  const userPrompt = shortDescriptionUserPrompt
    .render({
      appTitle: title,
      appDescription: description,
    })
    .trim();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  return response.choices[0].message.content || null;
}
