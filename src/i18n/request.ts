import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from '@/lib/utils/server-locale';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let userLocale = 'en';
  const localeFromPath = await requestLocale;
  if (localeFromPath) {
    userLocale = localeFromPath;
  } else {
    userLocale = await getUserLocale();
  }

  if (!routing.locales.includes(userLocale as 'en' | 'ja')) {
    console.log('userLocale not in routing.locales', userLocale);
    userLocale = 'en';
  }

  let messages;
  try {
    messages = (await import(`../../locales/${userLocale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${userLocale}`, error);
    try {
      messages = (await import('../../locales/en.json')).default;
      userLocale = 'en';
    } catch (fallbackError) {
      console.error('Failed to load fallback messages', fallbackError);
      messages = {};
    }
  }

  return {
    locale: userLocale,
    messages,
    timeZone: 'UTC',
    now: new Date(),
  };
});
