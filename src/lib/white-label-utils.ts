import { WHITE_LABEL_CONFIG } from './config';

export function interpolateWhiteLabelValues(text: string): string {
  return text
    .replace(/\{\{appName\}\}/g, WHITE_LABEL_CONFIG.appName)
    .replace(/\{\{domain\}\}/g, WHITE_LABEL_CONFIG.domain)
    .replace(/\{\{tagline\}\}/g, WHITE_LABEL_CONFIG.tagline)
    .replace(/\{\{description\}\}/g, WHITE_LABEL_CONFIG.description)
    .replace(/\{\{supportEmail\}\}/g, WHITE_LABEL_CONFIG.supportEmail)
    .replace(/\{\{infoEmail\}\}/g, WHITE_LABEL_CONFIG.infoEmail)
    .replace(/\{\{marketingEmail\}\}/g, WHITE_LABEL_CONFIG.marketingEmail)
    .replace(/\{\{marketingName\}\}/g, WHITE_LABEL_CONFIG.marketingName)
    .replace(/\{\{twitterHandle\}\}/g, WHITE_LABEL_CONFIG.twitterHandle);
}
