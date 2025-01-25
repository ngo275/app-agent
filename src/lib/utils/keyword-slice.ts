import { KeywordScore } from '@/types/aso';

/**
 * Selects the first n keywords to a maximum length, with a buffer for the length of the keywords.
 * This is useful to reduce the number of keywords that are going to be scored. Scoring is memory-expensive.
 * @param keywords - The keywords to slice.
 * @param maxCharacters - The maximum length of the keywords.
 * @param buffer - The buffer as a percentage of the maxCharacters.
 * @returns The sliced keywords.
 */
export function sliceKeywords<T extends string | { keyword: string }>(
  keywords: T[],
  maxCharacters: number,
  buffer: number = 0.1
): T[] {
  let totalLength = 0;
  const slicedKeywords: T[] = [];

  for (const keyword of keywords) {
    const keywordLength =
      typeof keyword === 'string' ? keyword.length : keyword.keyword.length;
    const newLength = totalLength + keywordLength;

    if (newLength <= maxCharacters + maxCharacters * buffer) {
      slicedKeywords.push(keyword);
      totalLength = newLength;
    } else {
      break;
    }
  }

  return slicedKeywords;
}
