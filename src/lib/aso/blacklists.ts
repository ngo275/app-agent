import { LocaleCode } from '../utils/locale';

export const BLACKLIST_KEYWORDS = {
  // English variants
  [LocaleCode.EN]: ['free'],
  [LocaleCode.EN_GB]: ['free'],
  [LocaleCode.EN_AU]: ['free'],
  [LocaleCode.EN_CA]: ['free'],

  // Chinese variants
  [LocaleCode.ZH_HANS]: ['免费', 'GPT', 'OpenAI', 'ChatGPT'],
  [LocaleCode.ZH_HANT]: ['免費', 'GPT', 'OpenAI', 'ChatGPT'],

  // Spanish variants
  [LocaleCode.ES]: ['gratis'],
  [LocaleCode.ES_MX]: ['gratis'],

  // French variants
  [LocaleCode.FR]: ['gratuit'],
  [LocaleCode.FR_CA]: ['gratuit'],

  // Portuguese variants
  [LocaleCode.PT]: ['gratuito'],
  [LocaleCode.PT_BR]: ['gratuito'],

  // Other languages
  [LocaleCode.AR]: ['مجاني'],
  [LocaleCode.CA]: ['gratuït'],
  [LocaleCode.HR]: ['besplatno'],
  [LocaleCode.CS]: ['zdarma'],
  [LocaleCode.DA]: ['gratis'],
  [LocaleCode.NL]: ['gratis'],
  [LocaleCode.FI]: ['ilmainen'],
  [LocaleCode.DE]: ['kostenlos'],
  [LocaleCode.EL]: ['δωρεάν'],
  [LocaleCode.HE]: ['חינם'],
  [LocaleCode.HI]: ['मुफ्त'],
  [LocaleCode.HU]: ['ingyenes'],
  [LocaleCode.ID]: ['gratis'],
  [LocaleCode.IT]: ['gratuito'],
  [LocaleCode.JA]: ['無料'],
  [LocaleCode.KO]: ['무료'],
  [LocaleCode.MS]: ['percuma'],
  [LocaleCode.NO]: ['gratis'],
  [LocaleCode.PL]: ['za darmo'],
  [LocaleCode.RO]: ['gratuit'],
  [LocaleCode.RU]: ['бесплатно'],
  [LocaleCode.SK]: ['zadarmo'],
  [LocaleCode.SV]: ['gratis'],
  [LocaleCode.TH]: ['ฟรี'],
  [LocaleCode.TR]: ['ücretsiz'],
  [LocaleCode.UK]: ['безкоштовно'],
  [LocaleCode.VI]: ['miễn phí'],
};
