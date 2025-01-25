import { NextRequest, NextResponse } from 'next/server';
import { LocaleCode } from '@/lib/utils/locale';
import { searchApps } from '@/lib/app-store/search-apps';
import { getLocaleString } from '@/lib/app-store/country-mapper';
import { getCountryCode } from '@/lib/app-store/country-mapper';

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string; appId: string; locale: string } }
) {
  try {
    const { term, store = 'APPSTORE', platform = 'IOS' } = await request.json();

    if (!term) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }

    // This is only for App Store
    const results = await searchApps({
      country: getCountryCode(params.locale as LocaleCode),
      language: getLocaleString(params.locale as LocaleCode),
      term,
      num: 10,
    });

    const apps = results.apps;

    return NextResponse.json(apps);
  } catch (error) {
    console.error('Error searching competitors:', error);
    return NextResponse.json(
      { error: 'Failed to search competitors' },
      { status: 500 }
    );
  }
}
