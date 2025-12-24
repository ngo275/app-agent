import scraperClient from '@/lib/google-play/scraper-client';
import { LocaleCode } from '@/lib/utils/locale';
import {
  getCountryCode,
  getLanguageCode,
} from '@/lib/google-play/country-mapper';

/**
 * Get search suggestions for a given term
 * @param term The search term to get suggestions for
 * @param locale The locale code for the suggestions
 * @returns Array of suggestion strings (up to 5)
 */
export async function getSuggestions(
  term: string,
  locale: LocaleCode
): Promise<string[]> {
  const country = getCountryCode(locale);
  const lang = getLanguageCode(locale);

  const suggestions = await scraperClient.suggest({
    term,
    lang,
    country,
  });

  return suggestions;
}
