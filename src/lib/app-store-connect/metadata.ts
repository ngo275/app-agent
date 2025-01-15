import {
  AppStoreConnectAppInfoData,
  AppStoreConnectAppInfoLocalization,
  AppStoreConnectVersionData,
  AppStoreConnectVersionLocalization,
} from '@/types/app-store';
import {
  AppStoreConnectAgreementError,
  AppStoreConnectMetadataError,
  AppStoreConnectVersionsError,
  InvalidParamsError,
} from '@/types/errors';
import { draftVersion, publicVersion } from '@/lib/utils/versions';
import { Platform } from '@prisma/client';

export async function fetchAppInfos(
  token: string,
  appId: string
): Promise<AppStoreConnectAppInfoData[]> {
  const queryParams = new URLSearchParams({
    // 'fields[appInfos]': 'app,appInfoLocalizations',
    include: 'appInfoLocalizations',
    'fields[appInfoLocalizations]': 'locale,name,subtitle',
  });
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appInfos?${queryParams.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (
      error.errors?.[0]?.code ===
      'FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED'
    ) {
      throw new AppStoreConnectAgreementError(
        'Required App Store Connect agreement is missing or has expired. Please check your agreements in App Store Connect.'
      );
    }
    throw new AppStoreConnectMetadataError('Failed to fetch app infos');
  }

  const data = (await response.json()) as {
    data: AppStoreConnectAppInfoData[];
  };
  const appInfos = data.data;

  if (!appInfos.length) {
    throw new AppStoreConnectMetadataError('No app info found');
  }

  return appInfos;
}

export async function fetchAppInfoLocalizations(
  token: string,
  appInfoId: string
): Promise<AppStoreConnectAppInfoLocalization[]> {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/appInfos/${appInfoId}/appInfoLocalizations`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (
      error.errors?.[0]?.code ===
      'FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED'
    ) {
      throw new AppStoreConnectAgreementError(
        'Required App Store Connect agreement is missing or has expired. Please check your agreements in App Store Connect.'
      );
    }
    throw new AppStoreConnectMetadataError(
      'Failed to fetch app info localizations'
    );
  }

  const data = (await response.json()) as {
    data: AppStoreConnectAppInfoLocalization[];
  };
  const appInfoLocalizations = data.data;

  if (!appInfoLocalizations.length) {
    throw new AppStoreConnectMetadataError('No app info localization found');
  }

  return appInfoLocalizations;
}

export async function fetchLatestAppStoreVersion(
  token: string,
  appId: string
): Promise<AppStoreConnectVersionData[]> {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (
      error.errors?.[0]?.code ===
      'FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED'
    ) {
      throw new AppStoreConnectAgreementError(
        'Required App Store Connect agreement is missing or has expired. Please check your agreements in App Store Connect.'
      );
    }
    throw new AppStoreConnectMetadataError('Failed to fetch appStoreVersions');
  }

  const data = (await response.json()) as {
    data: AppStoreConnectVersionData[];
  };

  if (!data.data.length) {
    throw new AppStoreConnectMetadataError('No app store versions found');
  }

  return data.data;
}

export async function fetchAppStoreVersionLocalizations(
  token: string,
  appStoreVersionId: string
): Promise<AppStoreConnectVersionLocalization[]> {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/appStoreVersions/${appStoreVersionId}/appStoreVersionLocalizations`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (
      error.errors?.[0]?.code ===
      'FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED'
    ) {
      throw new AppStoreConnectAgreementError(
        'Required App Store Connect agreement is missing or has expired. Please check your agreements in App Store Connect.'
      );
    }
    throw new AppStoreConnectMetadataError(
      'Failed to fetch store version localizations'
    );
  }

  const data = (await response.json()) as {
    data: AppStoreConnectVersionLocalization[];
  };

  return data.data;
}

export async function fetchAppMetadata(
  token: string,
  appId: string,
  platform: Platform = 'IOS'
): Promise<{
  draftAppInfo: AppStoreConnectAppInfoData | null;
  draftAppInfoLocalizations: AppStoreConnectAppInfoLocalization[];
  publicAppInfo: AppStoreConnectAppInfoData | null;
  publicAppInfoLocalizations: AppStoreConnectAppInfoLocalization[];
  // TODO: Add mac support
  publicLatestVersion: AppStoreConnectVersionData | null;
  publicLatestLocalizations: AppStoreConnectVersionLocalization[];
  draftVersion?: AppStoreConnectVersionData;
  draftLocalizations?: AppStoreConnectVersionLocalization[];
}> {
  const appInfos = await fetchAppInfos(token, appId);
  const versions = await fetchLatestAppStoreVersion(token, appId);

  // Find the latest version and draft version based on state
  const draftVersions = versions.filter((v) =>
    draftVersion(v.attributes.appStoreState)
  );
  // TODO: Add mac support
  const draftLatestVersion = draftVersions.length
    ? draftVersions.filter((v) => v.attributes.platform === platform)[0]
    : null;
  const publicLatestVersion = versions.filter(
    (v) =>
      v.attributes.platform === platform &&
      publicVersion(v.attributes.appStoreState)
  )?.[0];

  const draftAppInfo = appInfos.find((appInfo) =>
    draftVersion(appInfo.attributes.appStoreState)
  );
  const draftAppInfoLocalizations = draftAppInfo
    ? await fetchAppInfoLocalizations(token, draftAppInfo.id)
    : [];
  const publicAppInfo = appInfos.find((appInfo) =>
    publicVersion(appInfo.attributes.appStoreState)
  );
  const publicAppInfoLocalizations = publicAppInfo
    ? await fetchAppInfoLocalizations(token, publicAppInfo.id)
    : [];

  if (!publicLatestVersion) {
    const draftLocalizations = draftLatestVersion
      ? await fetchAppStoreVersionLocalizations(token, draftLatestVersion.id)
      : undefined;
    // This app has not been released yet
    return {
      draftAppInfo: draftAppInfo ?? null,
      draftAppInfoLocalizations: draftAppInfoLocalizations,
      publicAppInfo: publicAppInfo ?? null,
      publicAppInfoLocalizations: publicAppInfoLocalizations,
      publicLatestVersion: null,
      publicLatestLocalizations: [],
      draftVersion: draftLatestVersion ?? undefined,
      draftLocalizations: draftLocalizations ?? undefined,
    };
  }

  const draftLocalizations =
    draftLatestVersion && draftLatestVersion.id !== publicLatestVersion.id
      ? await fetchAppStoreVersionLocalizations(token, draftLatestVersion.id)
      : undefined;

  const publicLatestLocalizations = await fetchAppStoreVersionLocalizations(
    token,
    publicLatestVersion.id
  );

  return {
    draftAppInfo: draftAppInfo ?? null,
    draftAppInfoLocalizations: draftAppInfoLocalizations,
    publicAppInfo: publicAppInfo ?? null,
    publicAppInfoLocalizations: publicAppInfoLocalizations,
    publicLatestVersion,
    publicLatestLocalizations: publicLatestLocalizations,
    ...(draftLatestVersion &&
      draftLatestVersion !== publicLatestVersion && {
        draftVersion: draftLatestVersion,
        draftLocalizations,
      }),
  };
}

export async function upsertLocalizationInfo(
  token: string,
  appInfoId: string,
  appInfoLocalizationId: string | null,
  localizationData: AppStoreConnectAppInfoLocalization['attributes']
) {
  const { locale, ...rest } = localizationData;
  // Update existing localization
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/appInfoLocalizations/${appInfoLocalizationId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          id: appInfoLocalizationId,
          type: 'appInfoLocalizations',
          attributes: rest,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new AppStoreConnectVersionsError(
      `Failed to update localization: ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return data.data;
}

/**
 * Updates an existing localization for a given localization ID.
 * @param token - The App Store Connect API token.
 * @param localizationId - The ID of the localization to update.
 * @param localizationData - An object containing the localization data to update.
 */
export async function updateLocalization(
  token: string,
  localizationId: string,
  localizationData: {
    // locale: string; // en-US, etc.
    description: string;
    keywords: string;
    marketingUrl: string;
    promotionalText: string;
    supportUrl: string;
    whatsNew?: string; // Release notes
  }
) {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations/${localizationId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          id: localizationId,
          type: 'appStoreVersionLocalizations',
          attributes: localizationData,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new AppStoreConnectVersionsError(
      `Failed to update localization: ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return data.data;
}
