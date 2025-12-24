import { NextRequest, NextResponse } from 'next/server';
import { Store } from '@prisma/client';
import { googlePlayToAppStore } from '@/lib/utils/locale';
import { searchApps as searchAppStoreApps } from '@/lib/app-store/search-apps';
import { getLocaleString as getAppStoreLocaleString } from '@/lib/app-store/country-mapper';
import { getCountryCode as getAppStoreCountryCode } from '@/lib/app-store/country-mapper';
import { searchApps as searchGooglePlayApps } from '@/lib/google-play/search-apps';

export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string; appId: string; locale: string } }
) {
  try {
    const {
      term,
      store = Store.APPSTORE,
      platform = 'IOS',
    } = await request.json();

    if (!term) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }

    let apps;

    if (store === Store.GOOGLEPLAY) {
      // Search on Google Play Store
      const results = await searchGooglePlayApps({
        term,
        num: 10,
        lang: params.locale.split('-')[0],
        country: params.locale.split('-')[1]?.toLowerCase() || 'us',
      });
      apps = results.apps;
    } else {
      // Search on App Store
      // Convert Google Play locale to App Store locale if needed
      const appStoreLocale = googlePlayToAppStore(params.locale);
      const results = await searchAppStoreApps({
        country: getAppStoreCountryCode(appStoreLocale),
        language: getAppStoreLocaleString(appStoreLocale),
        term,
        num: 10,
      });
      apps = results.apps;
    }

    return NextResponse.json(apps);
  } catch (error) {
    console.error('Error searching competitors:', error);
    return NextResponse.json(
      { error: 'Failed to search competitors' },
      { status: 500 }
    );
  }
}
