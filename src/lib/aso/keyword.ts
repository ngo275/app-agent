import { extractKeywords as extractKeywordsWithLlm } from '@/lib/llm/utils/extract-keywords';
import { rerankKeywords as rerankKeywordsWithLlm } from '@/lib/llm/utils/rerank-keywords';
import { redis } from '@/lib/redis';
import { CompetitorKeyword, Platform } from '@/types/aso';
import { LocaleCode } from '../utils/locale';

const CACHE_EXPIRATION = 60 * 60 * 24 * 7; // 1 week

export async function extractKeywords(
  locale: string,
  platform: Platform,
  id: string,
  ...inputs: string[]
) {
  const cacheKey = `keywords:${locale}:${platform}:${id}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    return cachedData as string[];
  }

  const filteredInputs = inputs.filter(
    (input): input is string => input !== undefined
  );
  const result = await extractKeywordsWithLlm(...filteredInputs);

  const keywords = result?.keywords.map((keyword) => keyword.trim()) || [];
  await redis.set(cacheKey, JSON.stringify(keywords), {
    ex: CACHE_EXPIRATION,
  });

  return keywords;
}

export async function rerankKeywords(
  title: string,
  shortDescription: string,
  locale: LocaleCode,
  keywords: CompetitorKeyword[]
) {
  const result = await rerankKeywordsWithLlm(
    title,
    shortDescription,
    locale,
    keywords
  );
  return result?.map((keyword) => keyword.toLowerCase().trim()) || [];
}
