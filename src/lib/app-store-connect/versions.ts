import {
  AppStoreState,
  AppStoreConnectVersionData,
  AppStoreConnectVersionLocalization,
  AppStoreConnectAppInfoLocalization,
  AppStoreConnectAppInfoData,
} from '@/types/app-store';
import {
  AppStoreConnectVersionsError,
  AppStoreConnectAgreementError,
  AppStoreConnectVersionConflictError,
  AppStoreConnectMetadataError,
} from '@/types/errors';
import prisma from '@/lib/prisma';
import {
  fetchAppInfoLocalizations,
  fetchAppMetadata,
  fetchAppStoreVersionLocalizations,
} from './metadata';
import {
  upsertAppStoreConnectAppVersion,
  upsertAppStoreConnectLocalization,
} from '../utils/versions';
import { upsertAppStoreConnectApp } from '../utils/versions';
import { LocaleCode } from '../utils/locale';
import { AppVersion, Platform } from '@/types/aso';

export async function fetchAppStoreVersions(token: string, appId: string) {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    // Check for agreement-related errors
    if (
      errorData.errors?.[0]?.code ===
      'FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED'
    ) {
      throw new AppStoreConnectAgreementError(
        'Required App Store Connect agreement is missing or has expired. Please check your agreements in App Store Connect.'
      );
    }

    throw new AppStoreConnectVersionsError(
      `Failed to fetch app store versions: ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return data.data as AppStoreConnectVersionData[];
}

/**
 * This checks if the local versions are up to date compared with App Store Connect
 * @param token
 * @param appId
 * @param platform
 * @returns
 */
export async function checkIfVersionUpToDate(
  token: string,
  appId: string,
  platform: Platform = 'IOS'
): Promise<{
  upToDate: boolean;
  localVersion?: {
    version: string;
    state: AppStoreState;
    id: string;
  };
  remoteVersion?: {
    version: string;
    state: AppStoreState;
    id: string;
  };
}> {
  const versions: AppStoreConnectVersionData[] = await fetchAppStoreVersions(
    token,
    appId
  );

  const localVersions: AppVersion[] = await prisma.appVersion.findMany({
    where: {
      appId: appId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const latestLocalVersion = localVersions[0];
  const latestRemoteVersion = versions.filter(
    (v: AppStoreConnectVersionData) => v.attributes.platform === platform
  )?.[0];
  const upToDate =
    latestLocalVersion?.version ===
      latestRemoteVersion?.attributes.versionString &&
    latestLocalVersion?.state === latestRemoteVersion?.attributes.appStoreState;
  return {
    upToDate,
    localVersion: latestLocalVersion
      ? {
          version: latestLocalVersion.version,
          state: latestLocalVersion.state as AppStoreState,
          id: latestLocalVersion.id,
        }
      : undefined,
    remoteVersion: latestRemoteVersion
      ? {
          version: latestRemoteVersion.attributes.versionString,
          state: latestRemoteVersion.attributes.appStoreState as AppStoreState,
          id: latestRemoteVersion.id,
        }
      : undefined,
  };
}

/**
 * Pulls the latest versions and localizations from App Store Connect and saves them to the database.
 * @param token - The App Store Connect API token.
 * @param appId - The ID of the app to sync.
 * @param teamId - The ID of the team.
 * @param primaryLocale - The primary locale of the app.
 */
export async function pullLatestVersionFromAppStoreConnect(
  token: string,
  appId: string,
  teamId: string,
  primaryLocale?: LocaleCode
) {
  if (!primaryLocale) {
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });
    primaryLocale = (app?.primaryLocale as LocaleCode) || 'en-US';
  }

  // NOTE: This uses async calls inside the transaction to fetch metadata and upsert versions and localizations
  // It may take a while to complete, so we increase the timeout to 20 seconds.
  await prisma.$transaction(
    async (prisma) => {
      const metadata = await fetchAppMetadata(token, appId);

      console.log(`Going to save localizations and versions for ${appId}`);

      // Upsert the app.
      const defaultAppInfoLocalization = (
        metadata.publicAppInfoLocalizations.length > 0
          ? metadata.publicAppInfoLocalizations
          : metadata.draftAppInfoLocalizations
      ).find((l) => l.attributes.locale === primaryLocale);
      if (!defaultAppInfoLocalization) {
        throw new AppStoreConnectMetadataError(
          `App info localization for locale ${primaryLocale} not found`
        );
      }
      await upsertAppStoreConnectApp(
        appId,
        teamId,
        defaultAppInfoLocalization,
        primaryLocale,
        'IOS'
      );

      // Function to upsert versions and their localizations
      async function upsertVersionAndLocalizations(
        versionData: AppStoreConnectVersionData,
        localizations: AppStoreConnectVersionLocalization[],
        appInfo: AppStoreConnectAppInfoData,
        appInfoLocalizations: AppStoreConnectAppInfoLocalization[]
      ) {
        // Upsert the app version
        await upsertAppStoreConnectAppVersion(appId, versionData, appInfo);

        // Upsert each localization
        for (const localization of localizations) {
          const appInfoLocalization = appInfoLocalizations.find(
            (l) => l.attributes.locale === localization.attributes.locale
          );
          if (!appInfoLocalization) {
            throw new AppStoreConnectMetadataError(
              `App info localization for locale ${localization.attributes.locale} not found`
            );
          }
          await upsertAppStoreConnectLocalization(
            appId,
            versionData.id,
            localization,
            appInfoLocalization
          );
        }
      }

      // Upsert latest version and its localizations
      if (
        metadata.publicLatestVersion &&
        metadata.publicLatestLocalizations &&
        metadata.publicAppInfo &&
        metadata.publicAppInfoLocalizations
      ) {
        console.log('upserting latest version and localizations');
        await upsertVersionAndLocalizations(
          metadata.publicLatestVersion,
          metadata.publicLatestLocalizations,
          metadata.publicAppInfo,
          metadata.publicAppInfoLocalizations
        );
      }

      // Upsert draft version and its localizations
      if (
        metadata.draftVersion &&
        metadata.draftLocalizations &&
        metadata.draftAppInfo &&
        metadata.draftAppInfoLocalizations
      ) {
        console.log('upserting draft version and localizations');
        await upsertVersionAndLocalizations(
          metadata.draftVersion,
          metadata.draftLocalizations,
          metadata.draftAppInfo,
          metadata.draftAppInfoLocalizations
        );
      }

      // Remove flag from app info
      await prisma.app.update({
        where: { id: appId },
        data: { isStaged: false },
      });

      console.log(`Successfully saved localizations and versions for ${appId}`);
    },
    {
      timeout: 20000, // Increase timeout to 20 seconds
    }
  );
}

export async function createNewVersion(
  token: string,
  appId: string,
  versionString: string,
  platform: Platform = 'IOS'
): Promise<AppStoreConnectVersionData> {
  const response = await fetch(
    'https://api.appstoreconnect.apple.com/v1/appStoreVersions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'appStoreVersions',
          attributes: {
            versionString: versionString,
            platform: platform,
          },
          relationships: {
            app: {
              data: {
                type: 'apps',
                id: appId,
              },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.errors?.[0]?.status === '409') {
      throw new AppStoreConnectVersionConflictError('Version already exists');
    }
    throw new AppStoreConnectVersionsError(
      `Failed to create new version: ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return data.data;
}

export async function addNewLocale(
  token: string,
  appInfoId: string,
  versionId: string,
  primaryLocale: LocaleCode,
  locale: LocaleCode
): Promise<{
  versionLocalization: AppStoreConnectVersionLocalization;
  appInfoLocalization: AppStoreConnectAppInfoLocalization;
}> {
  const localizations = await fetchAppStoreVersionLocalizations(
    token,
    versionId
  );

  const defaultLocalization = localizations.find(
    (l) => l.attributes.locale === primaryLocale
  );
  const payload = defaultLocalization
    ? {
        ...defaultLocalization.attributes,
        locale: locale,
      }
    : {
        locale: locale,
      };
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // https://developer.apple.com/documentation/appstoreconnectapi/appstoreversionlocalizationcreaterequest/data-data.dictionary/attributes-data.dictionary
        data: {
          type: 'appStoreVersionLocalizations',
          attributes: payload,
          relationships: {
            appStoreVersion: {
              data: {
                type: 'appStoreVersions',
                id: versionId,
              },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new AppStoreConnectVersionsError(
      `Failed to add new locale: ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  const newLocalization = data.data as AppStoreConnectVersionLocalization;

  const newAppInfoLocalizations = await fetchAppInfoLocalizations(
    token,
    appInfoId
  );
  const newAppInfoLocalization = newAppInfoLocalizations.find(
    (l) => l.attributes.locale === locale
  );
  if (!newAppInfoLocalization) {
    throw new AppStoreConnectMetadataError(
      `App info localization for locale ${locale} not found`
    );
  }

  return {
    versionLocalization: newLocalization,
    appInfoLocalization: newAppInfoLocalization,
  };
}
