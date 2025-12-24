import { GooglePlayLocaleCode } from '@/lib/utils/locale';

/**
 * Maps locale codes to Google Play country codes
 * @param locale The locale code
 * @returns The country code for Google Play API
 */
export function getCountryCode(locale: GooglePlayLocaleCode | string): string {
  // Extract country code from locale (e.g., 'en-US' -> 'us')
  const parts = locale.split('-');
  if (parts.length > 1) {
    return parts[1].toLowerCase();
  }
  // Default to US if no country code is provided
  return 'us';
}

/**
 * Maps locale codes to language codes for Google Play
 * @param locale The locale code
 * @returns The language code for Google Play API
 */
export function getLanguageCode(locale: GooglePlayLocaleCode | string): string {
  // Extract language code from locale (e.g., 'en-US' -> 'en')
  const parts = locale.split('-');
  return parts[0].toLowerCase();
}

/**
 * Gets the full locale string for Google Play
 * @param locale The locale code
 * @returns The locale string (e.g., 'en-US')
 */
export function getLocaleString(locale: GooglePlayLocaleCode | string): string {
  return locale.toString();
}
