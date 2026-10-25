import { useTranslations } from 'next-intl';
import { WHITE_LABEL_CONFIG } from '@/lib/config';

export function useWhiteLabelTranslations(namespace?: string) {
  const t = useTranslations(namespace);

  return (key: string, values?: Record<string, any>) => {
    const translation = t(key, values);

    return translation
      .replace(/AppAgent/g, WHITE_LABEL_CONFIG.appName)
      .replace(/app-agent\.ai/g, WHITE_LABEL_CONFIG.domain)
      .replace(/support@app-agent\.ai/g, WHITE_LABEL_CONFIG.supportEmail)
      .replace(/info@app-agent\.ai/g, WHITE_LABEL_CONFIG.infoEmail)
      .replace(/shu@app-agent\.ai/g, WHITE_LABEL_CONFIG.marketingEmail)
      .replace(/Shu from AppAgent/g, WHITE_LABEL_CONFIG.marketingName)
      .replace(
        /From ASO to Release, All Streamlined/g,
        WHITE_LABEL_CONFIG.tagline
      )
      .replace(/@ngo275/g, WHITE_LABEL_CONFIG.twitterHandle);
  };
}
