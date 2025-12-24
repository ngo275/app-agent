import { Country } from 'app-store-client';
import { AppStoreLocaleCode } from '@/lib/utils/locale';

export function getCountryCode(locale: AppStoreLocaleCode): Country {
  switch (locale) {
    // English variants
    case AppStoreLocaleCode.EN:
      return Country.US;
    case AppStoreLocaleCode.EN_GB:
      return Country.GB;
    case AppStoreLocaleCode.EN_AU:
      return Country.AU;
    case AppStoreLocaleCode.EN_CA:
      return Country.CA;

    // Chinese variants
    case AppStoreLocaleCode.ZH_HANS:
      return Country.CN;
    case AppStoreLocaleCode.ZH_HANT:
      return Country.TW;

    // Spanish variants
    case AppStoreLocaleCode.ES:
      return Country.ES;
    case AppStoreLocaleCode.ES_MX:
      return Country.MX;

    // French variants
    case AppStoreLocaleCode.FR:
      return Country.FR;
    case AppStoreLocaleCode.FR_CA:
      return Country.CA;

    // Portuguese variants
    case AppStoreLocaleCode.PT:
      return Country.PT;
    case AppStoreLocaleCode.PT_BR:
      return Country.BR;

    // Other languages - mapping to primary country where the language is spoken
    case AppStoreLocaleCode.AR:
      return Country.SA;
    case AppStoreLocaleCode.CA:
      return Country.ES; // Catalan -> Spain
    case AppStoreLocaleCode.HR:
      return Country.HR;
    case AppStoreLocaleCode.CS:
      return Country.CZ;
    case AppStoreLocaleCode.DA:
      return Country.DK;
    case AppStoreLocaleCode.NL:
      return Country.NL;
    case AppStoreLocaleCode.FI:
      return Country.FI;
    case AppStoreLocaleCode.DE:
      return Country.DE;
    case AppStoreLocaleCode.EL:
      return Country.GR;
    case AppStoreLocaleCode.HE:
      return Country.IL;
    case AppStoreLocaleCode.HI:
      return Country.IN;
    case AppStoreLocaleCode.HU:
      return Country.HU;
    case AppStoreLocaleCode.ID:
      return Country.ID;
    case AppStoreLocaleCode.IT:
      return Country.IT;
    case AppStoreLocaleCode.JA:
      return Country.JP;
    case AppStoreLocaleCode.KO:
      return Country.KR;
    case AppStoreLocaleCode.MS:
      return Country.MY;
    case AppStoreLocaleCode.NO:
      return Country.NO;
    case AppStoreLocaleCode.PL:
      return Country.PL;
    case AppStoreLocaleCode.RO:
      return Country.RO;
    case AppStoreLocaleCode.RU:
      return Country.RU;
    case AppStoreLocaleCode.SK:
      return Country.SK;
    case AppStoreLocaleCode.SV:
      return Country.SE;
    case AppStoreLocaleCode.TH:
      return Country.TH;
    case AppStoreLocaleCode.TR:
      return Country.TR;
    case AppStoreLocaleCode.UK:
      return Country.UA;
    case AppStoreLocaleCode.VI:
      return Country.VN;

    default:
      throw new Error(`Unsupported locale: ${locale}`);
  }
}

export function getLocaleString(locale: AppStoreLocaleCode): string {
  if (locale === AppStoreLocaleCode.ZH_HANS) {
    return 'zh-CN';
  }
  if (locale === AppStoreLocaleCode.ZH_HANT) {
    return 'zh-TW';
  }
  return locale.toString().toLowerCase();
}
