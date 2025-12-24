import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

import { LLM_API_KEY, LLM_BASE_URL } from '@/lib/config';

const openai = new OpenAI({
  apiKey: LLM_API_KEY,
  baseURL: LLM_BASE_URL || undefined,
});

export default openai;
export { zodResponseFormat };
