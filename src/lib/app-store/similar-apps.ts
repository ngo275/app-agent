import client from '@/lib/app-store/client';
import {
  getCountryCode,
  getLocaleString,
} from '@/lib/app-store/country-mapper';
import { LocaleCode } from '@/lib/utils/locale';
import { AppStoreApp } from '@/types/app-store';
import { tarseAppData } from '@/lib/aso/tarser';

export async function getSimilarApps(
  appId: string,
  locale: LocaleCode
): Promise<Partial<AppStoreApp>[]> {
  return (
    await client.similarApps({
      id: appId,
      country: getCountryCode(locale),
      language: getLocaleString(locale),
    })
  ).map(tarseAppData);
}
