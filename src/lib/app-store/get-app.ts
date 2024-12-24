import client from '@/lib/app-store/client';
import { tarseAppData } from '@/lib/aso/tarser';
import { AppStoreApp } from '@/types/app-store';
import { LocaleCode } from '@/lib/utils/locale';
import {
  getCountryCode,
  getLocaleString,
} from '@/lib/app-store/country-mapper';

export async function getApp(
  appId: string,
  locale: LocaleCode
): Promise<Partial<AppStoreApp>> {
  const app = await client.app({
    id: appId,
    country: getCountryCode(locale),
    language: getLocaleString(locale),
  });
  return tarseAppData(app);
}
