import scraperClient from '@/lib/google-play/scraper-client';
import { GooglePlaySimilarApp } from '@/types/google-play';
import { LocaleCode } from '@/lib/utils/locale';
import {
  getCountryCode,
  getLanguageCode,
} from '@/lib/google-play/country-mapper';

/**
 * Get similar apps for a given app from Google Play Store
 * @param appId The package name of the app
 * @param locale The locale code for the results
 * @returns Array of similar apps
 */
export async function getSimilarApps(
  appId: string,
  locale: LocaleCode
): Promise<GooglePlaySimilarApp[]> {
  const country = getCountryCode(locale);
  const lang = getLanguageCode(locale);

  const apps = await scraperClient.similar({
    appId,
    lang,
    country,
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
