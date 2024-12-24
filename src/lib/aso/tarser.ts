import { AppStoreApp } from '@/types/app-store';

/**
 * Tarses the App Store app data to include only the fields we want to display in the UI
 * This is used to reduce the amount of data we send to the UI and improve performance.
 * Also, to reduce the data to store in the cache server.
 * @param app
 * @returns
 */
export function tarseAppData(app: AppStoreApp): Partial<AppStoreApp> {
  const keysToInclude = [
    'id',
    'appId',
    'title',
    'url',
    'description',
    'icon',
    'version',
    'free',
    'score',
    'reviews',
  ];
  return Object.fromEntries(
    Object.entries(app).filter(([key]) => keysToInclude.includes(key))
  );
}
