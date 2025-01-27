import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import AppMiddleware from '@/lib/middleware/app';
import I18nMiddleware from '@/lib/middleware/i18n';
// import DomainMiddleware from "@/lib/middleware/domain";

import { BLOCKED_PATHNAMES } from '@/lib/config';
import PostHogMiddleware from '@/lib/middleware/posthog';
import { SUPPORTED_LOCALES, USER_LOCALE_COOKIE_NAME } from '@/lib/utils/locale';

function isAnalyticsPath(path: string) {
  // Create a regular expression
  // ^ - asserts position at start of the line
  // /ingest/ - matches the literal string "/ingest/"
  // .* - matches any character (except for line terminators) 0 or more times
  const pattern = /^\/ingest\/.*/;

  return pattern.test(path);
}

function isI18nPath(path: string) {
  const nonEnglishPatterns = SUPPORTED_LOCALES.filter(
    (locale) => locale !== 'en'
  ).map((locale) => `/${locale}`);
  return nonEnglishPatterns.some((pattern) => path.startsWith(pattern));
}

export const config = {
  // matcher: ['/((?!api|_next|.*\\..*).*)']
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!api/|_next/|_static|vendor|_icons|_vercel|favicon.ico|sitemap.xml).*)',
    '/(ja/:path*)',
  ],
};
export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get('host');

  if (isAnalyticsPath(path)) {
    return PostHogMiddleware(req);
  }

  if (isI18nPath(path)) {
    const response = I18nMiddleware(req);
    // Set the user locale cookie based on the path
    const locale = path.split('/')[1]; // Extract locale from path like /ja/...
    response.cookies.set(USER_LOCALE_COOKIE_NAME, locale);
    return response;
  }

  // if (
  //   (process.env.NODE_ENV === "development" && host?.includes(".local")) ||
  //   (process.env.NODE_ENV !== "development" &&
  //     !(
  //       host?.includes("localhost") ||
  //       host?.endsWith(".vercel.app")
  //     ))
  // ) {
  //   return DomainMiddleware(req);
  // }

  if (!path.startsWith('/view/')) {
    return AppMiddleware(req);
  }

  const url = req.nextUrl.clone();

  if (
    path.startsWith('/view/') &&
    (BLOCKED_PATHNAMES.some((blockedPath) => path.includes(blockedPath)) ||
      path.includes('.'))
  ) {
    url.pathname = '/404';
    return NextResponse.rewrite(url, { status: 404 });
  }

  return NextResponse.next();
}
