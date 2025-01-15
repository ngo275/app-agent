import prisma from '@/lib/prisma';
import {
  AppStoreConnectAppInfoData,
  AppStoreConnectAppInfoLocalization,
  AppStoreConnectVersionData,
  AppStoreConnectVersionLocalization,
  AppStoreState,
} from '@/types/app-store';
import { Platform } from '@/types/aso';
import { LocaleCode } from './locale';

export function publicVersion(state: string | AppStoreState) {
  if (
    typeof state === 'string' &&
    !Object.values(AppStoreState).includes(state as AppStoreState)
  ) {
    return false;
  }
  return (
    state === AppStoreState.READY_FOR_DISTRIBUTION ||
    state === AppStoreState.READY_FOR_SALE
  );
}

export function draftVersion(state: string | AppStoreState) {
  if (
    typeof state === 'string' &&
    !Object.values(AppStoreState).includes(state as AppStoreState)
  ) {
    return false;
  }
  const excludeStates = [AppStoreState.REPLACED_WITH_NEW_VERSION];
  return (
    !publicVersion(state) && !excludeStates.includes(state as AppStoreState)
  );
}

/**
 * Upserts an App in the database.
 * @param appId - The ID of the app.
 * @param teamId - The ID of the team.
 * @param defaultAppInfoLocalizations - The default app info localization data.
 * @param platform - The platform.
 */
export async function upsertAppStoreConnectApp(
  appId: string,
  teamId: string,
  defaultAppInfoLocalizations: AppStoreConnectAppInfoLocalization,
  primaryLocale: LocaleCode,
  platform: Platform
) {
  return prisma.app.upsert({
    where: { id: appId },
    update: {
      // The first one is the default one
      title: defaultAppInfoLocalizations.attributes.name,
      subtitle: defaultAppInfoLocalizations.attributes.subtitle,
      primaryLocale: primaryLocale,
    },
    create: {
      id: appId,
      teamId: teamId,
      // The first one is the default one
      title: defaultAppInfoLocalizations.attributes.name,
      subtitle: defaultAppInfoLocalizations.attributes.subtitle,
      primaryLocale: primaryLocale,
      store: 'APPSTORE',
      platform: platform,
      storeAppId: appId,
    },
  });
}

/**
 * Upserts an AppVersion in the database.
 * @param appId - The ID of the app.
 * @param versionData - The app version data.
 * @param appInfo - The app info data.
 */
export async function upsertAppStoreConnectAppVersion(
  appId: string,
  versionData: AppStoreConnectVersionData,
  appInfo: AppStoreConnectAppInfoData
) {
  // First try to find the existing version
  const existingVersion = await prisma.appVersion.findFirst({
    where: {
      appId,
      version: versionData.attributes.versionString,
      platform: versionData.attributes.platform as Platform,
    },
  });

  const versionFields = {
    version: versionData.attributes.versionString,
    releaseType: versionData.attributes.releaseType || '',
    appInfoId: appInfo.id,
    platform: versionData.attributes.platform as Platform,
    state: versionData.attributes.appStoreState,
    submission: versionData.attributes.reviewType || '',
    createdAt: versionData.attributes.createdDate,
  };

  if (existingVersion) {
    // If it exists, update with all fields
    return await prisma.appVersion.update({
      where: {
        id: existingVersion.id,
      },
      data: {
        ...versionFields,
        updatedAt: new Date(),
      },
    });
  }

  // If it doesn't exist, create it with all fields
  return await prisma.appVersion.create({
    data: {
      id: versionData.id,
      appId: appId,
      ...versionFields,
    },
  });
}

/**
 * Upserts an AppLocalization in the database.
 * @param appId - The ID of the app.
 * @param versionId - The ID of the app version.
 * @param localization - The localization data.
 * @param appInfoLocalization - The app info localization data.
 */
export async function upsertAppStoreConnectLocalization(
  appId: string,
  versionId: string,
  localization: AppStoreConnectVersionLocalization,
  appInfoLocalization: AppStoreConnectAppInfoLocalization
) {
  return prisma.appLocalization.upsert({
    where: {
      id: localization.id,
    },
    update: {
      title: appInfoLocalization.attributes.name,
      subtitle: appInfoLocalization.attributes.subtitle,
      appInfoLocalizationId: appInfoLocalization.id,
      privacyPolicyUrl: appInfoLocalization.attributes.privacyPolicyUrl,
      privacyChoicesUrl: appInfoLocalization.attributes.privacyChoicesUrl,
      privacyPolicyText: appInfoLocalization.attributes.privacyPolicyText,
      description: localization.attributes.description,
      keywords: localization.attributes.keywords,
      marketingUrl: localization.attributes.marketingUrl,
      promotionalText: localization.attributes.promotionalText,
      supportUrl: localization.attributes.supportUrl,
      whatsNew: localization.attributes.whatsNew,
    },
    create: {
      id: localization.id,
      appId: appId,
      appVersionId: versionId,
      locale: localization.attributes.locale,
      appInfoLocalizationId: appInfoLocalization.id,
      title: appInfoLocalization.attributes.name,
      subtitle: appInfoLocalization.attributes.subtitle,
      privacyPolicyUrl: appInfoLocalization.attributes.privacyPolicyUrl,
      privacyChoicesUrl: appInfoLocalization.attributes.privacyChoicesUrl,
      privacyPolicyText: appInfoLocalization.attributes.privacyPolicyText,
      description: localization.attributes.description,
      keywords: localization.attributes.keywords,
      marketingUrl: localization.attributes.marketingUrl,
      promotionalText: localization.attributes.promotionalText,
      supportUrl: localization.attributes.supportUrl,
      whatsNew: localization.attributes.whatsNew,
    },
  });
}

export async function hasPublicVersion(appId: string) {
  const appVersions = await prisma.appVersion.findMany({
    where: {
      appId,
    },
  });
  return appVersions.some((v) => publicVersion(v.state || ''));
}
