import scraperClient from '@/lib/google-play/scraper-client';
import { GooglePlayApp } from '@/types/google-play';
import { LocaleCode } from '@/lib/utils/locale';
import {
  getCountryCode,
  getLanguageCode,
} from '@/lib/google-play/country-mapper';

/**
 * Get detailed information about a specific app from Google Play Store
 * @param appId The package name of the app (e.g., 'com.google.android.apps.translate')
 * @param locale The locale code for the app information
 * @returns Detailed app information
 */
export async function getApp(
  appId: string,
  locale: LocaleCode
): Promise<GooglePlayApp> {
  const country = getCountryCode(locale);
  const lang = getLanguageCode(locale);

  const app = await scraperClient.app({
    appId,
    lang,
    country,
  });

  // Return the app data
  return app as GooglePlayApp;
}
