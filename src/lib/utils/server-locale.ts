'use server';

import { cookies, headers } from 'next/headers';
import Negotiator from 'negotiator';
import { SUPPORTED_LOCALES, USER_LOCALE_COOKIE_NAME } from './locale';

export const getUserLocale = async (): Promise<string> => {
  // 1. Read cookies & Accept-Language
  const userCookie = cookies().get(USER_LOCALE_COOKIE_NAME)?.value;
  const acceptLanguage = headers().get('accept-language') || '';

  // 2. Decide which locale to use
  let userLocale: string;
  if (userCookie && SUPPORTED_LOCALES.includes(userCookie)) {
    // If we have a valid cookie, use that
    userLocale = userCookie;
  } else {
    // Otherwise, try to pick from Accept-Language
    const negotiator = new Negotiator({
      headers: {
        'Accept-Language': acceptLanguage,
      },
    });
    // Get all matching languages in order of preference
    const matches = negotiator.languages(SUPPORTED_LOCALES);
    // Use first match if available, otherwise fallback to 'en'
    const bestMatch = matches[0];
    console.log('bestMatch', bestMatch);
    userLocale = bestMatch || 'en';
  }

  return userLocale;
};
