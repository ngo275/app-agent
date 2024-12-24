import { cookies, headers } from 'next/headers';
import Negotiator from 'negotiator';

// https://developer.apple.com/documentation/appstoreconnectapi/managing-metadata-in-your-app-by-using-locale-shortcodes
export enum LocaleCode {
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

export const getLocaleName = (locale: LocaleCode): string => {
  switch (locale) {
    // English variants
    case LocaleCode.EN:
      return 'English (US)';
    case LocaleCode.EN_GB:
      return 'English (UK)';
    case LocaleCode.EN_AU:
      return 'English (Australia)';
    case LocaleCode.EN_CA:
      return 'English (Canada)';
    // case LocaleCode.EN_IN: return 'English (India)';
    // case LocaleCode.EN_IE: return 'English (Ireland)';
    // case LocaleCode.EN_NZ: return 'English (New Zealand)';
    // case LocaleCode.EN_SG: return 'English (Singapore)';
    // case LocaleCode.EN_ZA: return 'English (South Africa)';

    // Chinese variants
    case LocaleCode.ZH_HANS:
      return 'Chinese (Simplified)';
    case LocaleCode.ZH_HANT:
      return 'Chinese (Traditional)';
    // case LocaleCode.ZH_HK: return 'Chinese (Hong Kong)';

    // Spanish variants
    case LocaleCode.ES:
      return 'Spanish';
    // case LocaleCode.ES_419: return 'Spanish (Latin America)';
    case LocaleCode.ES_MX:
      return 'Spanish (Mexico)';

    // French variants
    case LocaleCode.FR:
      return 'French';
    case LocaleCode.FR_CA:
      return 'French (Canadian)';

    // Portuguese variants
    case LocaleCode.PT:
      return 'Portuguese';
    case LocaleCode.PT_BR:
      return 'Portuguese (Brazil)';

    // Other languages
    case LocaleCode.AR:
      return 'Arabic';
    case LocaleCode.CA:
      return 'Catalan';
    case LocaleCode.HR:
      return 'Croatian';
    case LocaleCode.CS:
      return 'Czech';
    case LocaleCode.DA:
      return 'Danish';
    case LocaleCode.NL:
      return 'Dutch';
    case LocaleCode.FI:
      return 'Finnish';
    case LocaleCode.DE:
      return 'German';
    case LocaleCode.EL:
      return 'Greek';
    case LocaleCode.HE:
      return 'Hebrew';
    case LocaleCode.HI:
      return 'Hindi';
    case LocaleCode.HU:
      return 'Hungarian';
    case LocaleCode.ID:
      return 'Indonesian';
    case LocaleCode.IT:
      return 'Italian';
    case LocaleCode.JA:
      return 'Japanese';
    case LocaleCode.KO:
      return 'Korean';
    case LocaleCode.MS:
      return 'Malay';
    case LocaleCode.NO:
      return 'Norwegian';
    case LocaleCode.PL:
      return 'Polish';
    case LocaleCode.RO:
      return 'Romanian';
    case LocaleCode.RU:
      return 'Russian';
    case LocaleCode.SK:
      return 'Slovak';
    case LocaleCode.SV:
      return 'Swedish';
    case LocaleCode.TH:
      return 'Thai';
    case LocaleCode.TR:
      return 'Turkish';
    case LocaleCode.UK:
      return 'Ukrainian';
    case LocaleCode.VI:
      return 'Vietnamese';

    default:
      return locale;
  }
};

export const getAllStoreLocales = (): LocaleCode[] => {
  return Object.values(LocaleCode);
};

export const SUPPORTED_LOCALES = ['en', 'ja'];
export const USER_LOCALE_COOKIE_NAME = 'localePreference';
