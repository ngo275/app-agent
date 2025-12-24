import { cookies, headers } from 'next/headers';
import Negotiator from 'negotiator';

// https://developer.apple.com/documentation/appstoreconnectapi/managing-metadata-in-your-app-by-using-locale-shortcodes
// Apple Store locale codes
export enum AppStoreLocaleCode {
  // English variants
  EN = 'en-US',
  EN_GB = 'en-GB',
  EN_AU = 'en-AU',
  EN_CA = 'en-CA',

  // Chinese variants
  ZH_HANS = 'zh-Hans',
  ZH_HANT = 'zh-Hant',

  // Spanish variants
  ES = 'es-ES',
  ES_MX = 'es-MX',

  // French variants
  FR = 'fr-FR',
  FR_CA = 'fr-CA',

  // Portuguese variants
  PT = 'pt-PT',
  PT_BR = 'pt-BR',

  // Other languages
  AR = 'ar-SA',
  CA = 'ca',
  HR = 'hr',
  CS = 'cs',
  DA = 'da',
  NL = 'nl-NL',
  FI = 'fi',
  DE = 'de-DE',
  EL = 'el',
  HE = 'he',
  HI = 'hi',
  HU = 'hu',
  ID = 'id',
  IT = 'it',
  JA = 'ja',
  KO = 'ko',
  MS = 'ms',
  NO = 'no',
  PL = 'pl',
  RO = 'ro',
  RU = 'ru',
  SK = 'sk',
  SV = 'sv',
  TH = 'th',
  TR = 'tr',
  UK = 'uk',
  VI = 'vi',
}

// Google Play Store locale codes (format: language-COUNTRY)
export enum GooglePlayLocaleCode {
  // English variants
  EN_US = 'en-US',
  EN_GB = 'en-GB',
  EN_AU = 'en-AU',
  EN_CA = 'en-CA',

  // Chinese variants
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',

  // Spanish variants
  ES_ES = 'es-ES',
  ES_MX = 'es-MX',

  // French variants
  FR_FR = 'fr-FR',
  FR_CA = 'fr-CA',

  // Portuguese variants
  PT_PT = 'pt-PT',
  PT_BR = 'pt-BR',

  // Other languages with country codes
  AR_SA = 'ar-SA',
  CA_ES = 'ca-ES',
  HR_HR = 'hr-HR',
  CS_CZ = 'cs-CZ',
  DA_DK = 'da-DK',
  NL_NL = 'nl-NL',
  FI_FI = 'fi-FI',
  DE_DE = 'de-DE',
  EL_GR = 'el-GR',
  HE_IL = 'he-IL',
  HI_IN = 'hi-IN',
  HU_HU = 'hu-HU',
  ID_ID = 'id-ID',
  IT_IT = 'it-IT',
  JA_JP = 'ja-JP',
  KO_KR = 'ko-KR',
  MS_MY = 'ms-MY',
  NO_NO = 'no-NO',
  PL_PL = 'pl-PL',
  RO_RO = 'ro-RO',
  RU_RU = 'ru-RU',
  SK_SK = 'sk-SK',
  SV_SE = 'sv-SE',
  TH_TH = 'th-TH',
  TR_TR = 'tr-TR',
  UK_UA = 'uk-UA',
  VI_VN = 'vi-VN',
}

// Keep LocaleCode as alias for backward compatibility
export type LocaleCode = AppStoreLocaleCode | GooglePlayLocaleCode;
export const LocaleCode = { ...AppStoreLocaleCode, ...GooglePlayLocaleCode };

export const getLocaleName = (
  locale: AppStoreLocaleCode | GooglePlayLocaleCode
): string => {
  switch (locale) {
    // English variants
    case AppStoreLocaleCode.EN:
    case GooglePlayLocaleCode.EN_US:
      return 'English (US)';
    case AppStoreLocaleCode.EN_GB:
    case GooglePlayLocaleCode.EN_GB:
      return 'English (UK)';
    case AppStoreLocaleCode.EN_AU:
    case GooglePlayLocaleCode.EN_AU:
      return 'English (Australia)';
    case AppStoreLocaleCode.EN_CA:
    case GooglePlayLocaleCode.EN_CA:
      return 'English (Canada)';
    // case LocaleCode.EN_IN: return 'English (India)';
    // case LocaleCode.EN_IE: return 'English (Ireland)';
    // case LocaleCode.EN_NZ: return 'English (New Zealand)';
    // case LocaleCode.EN_SG: return 'English (Singapore)';
    // case LocaleCode.EN_ZA: return 'English (South Africa)';

    // Chinese variants
    case AppStoreLocaleCode.ZH_HANS:
    case GooglePlayLocaleCode.ZH_CN:
      return 'Chinese (Simplified)';
    case AppStoreLocaleCode.ZH_HANT:
    case GooglePlayLocaleCode.ZH_TW:
      return 'Chinese (Traditional)';

    // Spanish variants
    case AppStoreLocaleCode.ES:
    case GooglePlayLocaleCode.ES_ES:
      return 'Spanish';
    case AppStoreLocaleCode.ES_MX:
    case GooglePlayLocaleCode.ES_MX:
      return 'Spanish (Mexico)';

    // French variants
    case AppStoreLocaleCode.FR:
    case GooglePlayLocaleCode.FR_FR:
      return 'French';
    case AppStoreLocaleCode.FR_CA:
    case GooglePlayLocaleCode.FR_CA:
      return 'French (Canadian)';

    // Portuguese variants
    case AppStoreLocaleCode.PT:
    case GooglePlayLocaleCode.PT_PT:
      return 'Portuguese';
    case AppStoreLocaleCode.PT_BR:
    case GooglePlayLocaleCode.PT_BR:
      return 'Portuguese (Brazil)';

    // Other languages
    case AppStoreLocaleCode.AR:
    case GooglePlayLocaleCode.AR_SA:
      return 'Arabic';
    case AppStoreLocaleCode.CA:
    case GooglePlayLocaleCode.CA_ES:
      return 'Catalan';
    case AppStoreLocaleCode.HR:
    case GooglePlayLocaleCode.HR_HR:
      return 'Croatian';
    case AppStoreLocaleCode.CS:
    case GooglePlayLocaleCode.CS_CZ:
      return 'Czech';
    case AppStoreLocaleCode.DA:
    case GooglePlayLocaleCode.DA_DK:
      return 'Danish';
    case AppStoreLocaleCode.NL:
    case GooglePlayLocaleCode.NL_NL:
      return 'Dutch';
    case AppStoreLocaleCode.FI:
    case GooglePlayLocaleCode.FI_FI:
      return 'Finnish';
    case AppStoreLocaleCode.DE:
    case GooglePlayLocaleCode.DE_DE:
      return 'German';
    case AppStoreLocaleCode.EL:
    case GooglePlayLocaleCode.EL_GR:
      return 'Greek';
    case AppStoreLocaleCode.HE:
    case GooglePlayLocaleCode.HE_IL:
      return 'Hebrew';
    case AppStoreLocaleCode.HI:
    case GooglePlayLocaleCode.HI_IN:
      return 'Hindi';
    case AppStoreLocaleCode.HU:
    case GooglePlayLocaleCode.HU_HU:
      return 'Hungarian';
    case AppStoreLocaleCode.ID:
    case GooglePlayLocaleCode.ID_ID:
      return 'Indonesian';
    case AppStoreLocaleCode.IT:
    case GooglePlayLocaleCode.IT_IT:
      return 'Italian';
    case AppStoreLocaleCode.JA:
    case GooglePlayLocaleCode.JA_JP:
      return 'Japanese';
    case AppStoreLocaleCode.KO:
    case GooglePlayLocaleCode.KO_KR:
      return 'Korean';
    case AppStoreLocaleCode.MS:
    case GooglePlayLocaleCode.MS_MY:
      return 'Malay';
    case AppStoreLocaleCode.NO:
    case GooglePlayLocaleCode.NO_NO:
      return 'Norwegian';
    case AppStoreLocaleCode.PL:
    case GooglePlayLocaleCode.PL_PL:
      return 'Polish';
    case AppStoreLocaleCode.RO:
    case GooglePlayLocaleCode.RO_RO:
      return 'Romanian';
    case AppStoreLocaleCode.RU:
    case GooglePlayLocaleCode.RU_RU:
      return 'Russian';
    case AppStoreLocaleCode.SK:
    case GooglePlayLocaleCode.SK_SK:
      return 'Slovak';
    case AppStoreLocaleCode.SV:
    case GooglePlayLocaleCode.SV_SE:
      return 'Swedish';
    case AppStoreLocaleCode.TH:
    case GooglePlayLocaleCode.TH_TH:
      return 'Thai';
    case AppStoreLocaleCode.TR:
    case GooglePlayLocaleCode.TR_TR:
      return 'Turkish';
    case AppStoreLocaleCode.UK:
    case GooglePlayLocaleCode.UK_UA:
      return 'Ukrainian';
    case AppStoreLocaleCode.VI:
    case GooglePlayLocaleCode.VI_VN:
      return 'Vietnamese';

    default:
      return locale;
  }
};

export const getAllStoreLocales = (): LocaleCode[] => {
  return [
    ...Object.values(AppStoreLocaleCode),
    ...Object.values(GooglePlayLocaleCode),
  ];
};

export const SUPPORTED_LOCALES = ['en', 'ja'];
export const USER_LOCALE_COOKIE_NAME = 'localePreference';

/**
 * Converts a Google Play locale code to an Apple Store locale code
 * @param googlePlayLocale Google Play locale code (e.g., 'it-IT', 'ja-JP')
 * @returns Corresponding Apple Store locale code
 */
export function googlePlayToAppStore(
  googlePlayLocale: GooglePlayLocaleCode | string
): AppStoreLocaleCode {
  const localeStr = googlePlayLocale.toString();

  // Direct mappings for special cases
  const mappings: Record<string, AppStoreLocaleCode> = {
    'en-US': AppStoreLocaleCode.EN,
    'en-GB': AppStoreLocaleCode.EN_GB,
    'en-AU': AppStoreLocaleCode.EN_AU,
    'en-CA': AppStoreLocaleCode.EN_CA,
    'zh-CN': AppStoreLocaleCode.ZH_HANS,
    'zh-TW': AppStoreLocaleCode.ZH_HANT,
    'es-ES': AppStoreLocaleCode.ES,
    'es-MX': AppStoreLocaleCode.ES_MX,
    'fr-FR': AppStoreLocaleCode.FR,
    'fr-CA': AppStoreLocaleCode.FR_CA,
    'pt-PT': AppStoreLocaleCode.PT,
    'pt-BR': AppStoreLocaleCode.PT_BR,
    'ar-SA': AppStoreLocaleCode.AR,
    'ca-ES': AppStoreLocaleCode.CA,
    'hr-HR': AppStoreLocaleCode.HR,
    'cs-CZ': AppStoreLocaleCode.CS,
    'da-DK': AppStoreLocaleCode.DA,
    'nl-NL': AppStoreLocaleCode.NL,
    'fi-FI': AppStoreLocaleCode.FI,
    'de-DE': AppStoreLocaleCode.DE,
    'el-GR': AppStoreLocaleCode.EL,
    'he-IL': AppStoreLocaleCode.HE,
    'hi-IN': AppStoreLocaleCode.HI,
    'hu-HU': AppStoreLocaleCode.HU,
    'id-ID': AppStoreLocaleCode.ID,
    'it-IT': AppStoreLocaleCode.IT,
    'ja-JP': AppStoreLocaleCode.JA,
    'ko-KR': AppStoreLocaleCode.KO,
    'ms-MY': AppStoreLocaleCode.MS,
    'no-NO': AppStoreLocaleCode.NO,
    'pl-PL': AppStoreLocaleCode.PL,
    'ro-RO': AppStoreLocaleCode.RO,
    'ru-RU': AppStoreLocaleCode.RU,
    'sk-SK': AppStoreLocaleCode.SK,
    'sv-SE': AppStoreLocaleCode.SV,
    'th-TH': AppStoreLocaleCode.TH,
    'tr-TR': AppStoreLocaleCode.TR,
    'uk-UA': AppStoreLocaleCode.UK,
    'vi-VN': AppStoreLocaleCode.VI,
  };

  const mapped = mappings[localeStr];
  if (mapped) {
    return mapped;
  }

  throw new Error(`Unsupported Google Play locale: ${googlePlayLocale}`);
}

/**
 * Converts an Apple Store locale code to a Google Play locale code
 * @param appStoreLocale Apple Store locale code (e.g., 'it', 'ja')
 * @returns Corresponding Google Play locale code
 */
export function appStoreToGooglePlay(
  appStoreLocale: AppStoreLocaleCode | string
): GooglePlayLocaleCode {
  const localeStr = appStoreLocale.toString();

  // Direct mappings
  const mappings: Record<string, GooglePlayLocaleCode> = {
    'en-US': GooglePlayLocaleCode.EN_US,
    'en-GB': GooglePlayLocaleCode.EN_GB,
    'en-AU': GooglePlayLocaleCode.EN_AU,
    'en-CA': GooglePlayLocaleCode.EN_CA,
    'zh-Hans': GooglePlayLocaleCode.ZH_CN,
    'zh-Hant': GooglePlayLocaleCode.ZH_TW,
    'es-ES': GooglePlayLocaleCode.ES_ES,
    'es-MX': GooglePlayLocaleCode.ES_MX,
    'fr-FR': GooglePlayLocaleCode.FR_FR,
    'fr-CA': GooglePlayLocaleCode.FR_CA,
    'pt-PT': GooglePlayLocaleCode.PT_PT,
    'pt-BR': GooglePlayLocaleCode.PT_BR,
    'ar-SA': GooglePlayLocaleCode.AR_SA,
    ca: GooglePlayLocaleCode.CA_ES,
    hr: GooglePlayLocaleCode.HR_HR,
    cs: GooglePlayLocaleCode.CS_CZ,
    da: GooglePlayLocaleCode.DA_DK,
    'nl-NL': GooglePlayLocaleCode.NL_NL,
    fi: GooglePlayLocaleCode.FI_FI,
    'de-DE': GooglePlayLocaleCode.DE_DE,
    el: GooglePlayLocaleCode.EL_GR,
    he: GooglePlayLocaleCode.HE_IL,
    hi: GooglePlayLocaleCode.HI_IN,
    hu: GooglePlayLocaleCode.HU_HU,
    id: GooglePlayLocaleCode.ID_ID,
    it: GooglePlayLocaleCode.IT_IT,
    ja: GooglePlayLocaleCode.JA_JP,
    ko: GooglePlayLocaleCode.KO_KR,
    ms: GooglePlayLocaleCode.MS_MY,
    no: GooglePlayLocaleCode.NO_NO,
    pl: GooglePlayLocaleCode.PL_PL,
    ro: GooglePlayLocaleCode.RO_RO,
    ru: GooglePlayLocaleCode.RU_RU,
    sk: GooglePlayLocaleCode.SK_SK,
    sv: GooglePlayLocaleCode.SV_SE,
    th: GooglePlayLocaleCode.TH_TH,
    tr: GooglePlayLocaleCode.TR_TR,
    uk: GooglePlayLocaleCode.UK_UA,
    vi: GooglePlayLocaleCode.VI_VN,
  };

  const mapped = mappings[localeStr];
  if (mapped) {
    return mapped;
  }

  throw new Error(`Unsupported App Store locale: ${appStoreLocale}`);
}
