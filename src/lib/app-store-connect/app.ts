import { AppStoreConnectAppData } from '@/types/app-store';
import {
  AppStoreConnectAgreementError,
  AppStoreConnectAppsError,
} from '@/types/errors';

export async function getAppStoreConnectAppList(
  token: string
): Promise<AppStoreConnectAppData[]> {
  // const fields = 'id,name,appStoreVersions(data(attributes(version,platform))),appStoreState';
  const query = `fields[apps]=name,bundleId,isOrEverWasMadeForKids,primaryLocale,sku`;
  const result = await fetch(
    `https://api.appstoreconnect.apple.com/v1/apps?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!result.ok) {
    const error = await result.json();
    if (
      error.errors?.[0]?.code ===
      'FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED'
    ) {
      throw new AppStoreConnectAgreementError(
        'Required App Store Connect agreement is missing or has expired. Please check your agreements in App Store Connect.'
      );
    }
    throw new AppStoreConnectAppsError('Failed to fetch app');
  }

  const data = await result.json();
  if (!data.data) {
    return [];
  }
  return data.data.map((app: Record<string, any>) => ({
    id: app.id,
    attributes: {
      name: app.attributes.name,
      bundleId: app.attributes.bundleId,
      isOrEverWasMadeForKids: app.attributes.isOrEverWasMadeForKids,
      primaryLocale: app.attributes.primaryLocale,
      sku: app.attributes.sku,
    },
  }));
}
