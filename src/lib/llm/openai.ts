import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

import { OPENAI_API_KEY } from '@/lib/config';

// TODO: should allow Azure config in the future
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export default openai;
export { zodResponseFormat };
