import { Country } from 'app-store-client';
import { LocaleCode } from '@/lib/utils/locale';

export function getCountryCode(locale: LocaleCode): Country {
  switch (locale) {
    // English variants
    case LocaleCode.EN:
      return Country.US;
    case LocaleCode.EN_GB:
      return Country.GB;
    case LocaleCode.EN_AU:
      return Country.AU;
    case LocaleCode.EN_CA:
      return Country.CA;

    // Chinese variants
    case LocaleCode.ZH_HANS:
      return Country.CN;
    case LocaleCode.ZH_HANT:
      return Country.TW;

    // Spanish variants
    case LocaleCode.ES:
      return Country.ES;
    case LocaleCode.ES_MX:
      return Country.MX;

    // French variants
    case LocaleCode.FR:
      return Country.FR;
    case LocaleCode.FR_CA:
      return Country.CA;

    // Portuguese variants
    case LocaleCode.PT:
      return Country.PT;
    case LocaleCode.PT_BR:
      return Country.BR;

    // Other languages - mapping to primary country where the language is spoken
    case LocaleCode.AR:
      return Country.SA;
    case LocaleCode.CA:
      return Country.ES; // Catalan -> Spain
    case LocaleCode.HR:
      return Country.HR;
    case LocaleCode.CS:
      return Country.CZ;
    case LocaleCode.DA:
      return Country.DK;
    case LocaleCode.NL:
      return Country.NL;
    case LocaleCode.FI:
      return Country.FI;
    case LocaleCode.DE:
      return Country.DE;
    case LocaleCode.EL:
      return Country.GR;
    case LocaleCode.HE:
      return Country.IL;
    case LocaleCode.HI:
      return Country.IN;
    case LocaleCode.HU:
      return Country.HU;
    case LocaleCode.ID:
      return Country.ID;
    case LocaleCode.IT:
      return Country.IT;
    case LocaleCode.JA:
      return Country.JP;
    case LocaleCode.KO:
      return Country.KR;
    case LocaleCode.MS:
      return Country.MY;
    case LocaleCode.NO:
      return Country.NO;
    case LocaleCode.PL:
      return Country.PL;
    case LocaleCode.RO:
      return Country.RO;
    case LocaleCode.RU:
      return Country.RU;
    case LocaleCode.SK:
      return Country.SK;
    case LocaleCode.SV:
      return Country.SE;
    case LocaleCode.TH:
      return Country.TH;
    case LocaleCode.TR:
      return Country.TR;
    case LocaleCode.UK:
      return Country.UA;
    case LocaleCode.VI:
      return Country.VN;

    default:
      throw new Error(`Unsupported locale: ${locale}`);
  }
}

export function getLocaleString(locale: LocaleCode): string {
  if (locale === LocaleCode.ZH_HANS) {
    return 'zh-CN';
  }
  if (locale === LocaleCode.ZH_HANT) {
    return 'zh-TW';
  }
  return locale.toString().toLowerCase();
}
