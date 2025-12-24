import scraperClient from '@/lib/google-play/scraper-client';
import { GooglePlaySearchResult } from '@/types/google-play';
import { LocaleCode } from '@/lib/utils/locale';
import {
  getCountryCode,
  getLanguageCode,
} from '@/lib/google-play/country-mapper';

/**
 * Get all apps by a specific developer from Google Play Store
 * @param devId The developer name or ID
 * @param locale The locale code for the results
 * @param num Number of apps to retrieve (default: 60)
 * @returns Array of apps by the developer
 */
export async function getDeveloperApps(
  devId: string,
  locale: LocaleCode,
  num: number = 60
): Promise<GooglePlaySearchResult[]> {
  const country = getCountryCode(locale);
  const lang = getLanguageCode(locale);

  const apps = await scraperClient.developer({
    devId,
    lang,
    country,
    num,
    fullDetail: false,
  });

  // Transform results to match our type
  return apps.map((app: any) => ({
    appId: app.appId,
    title: app.title,
    summary: app.summary,
    developer: app.developer,
    developerId: app.developerId,
    icon: app.icon,
    score: app.score,
    scoreText: app.scoreText,
    priceText: app.priceText,
    free: app.free,
    url: app.url,
  }));
}
