import { SUPPORTED_LOCALES, USER_LOCALE_COOKIE_NAME } from '@/lib/utils/locale';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Set the locale preference cookie
export async function POST(request: NextRequest) {
  try {
    const { locale } = await request.json();

    if (!SUPPORTED_LOCALES.includes(locale)) {
      return new NextResponse(JSON.stringify({ error: 'Unsupported locale' }), {
        status: 400,
      });
    }

    const response = new NextResponse(
      JSON.stringify({ success: true, locale }),
      { status: 200 }
    );
    response.cookies.set(USER_LOCALE_COOKIE_NAME, locale, {
      // Set your desired cookie options
      path: '/',
      httpOnly: false, // If you want it accessible to the browser
    });

    return response;
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400 }
    );
  }
}
