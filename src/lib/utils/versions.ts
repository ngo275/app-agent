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
  // Google Play states
  if (state === 'completed' || state === 'inProgress') {
    return true;
  }

  // App Store Connect states
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
  // Google Play states
  if (state === 'draft') {
    return true;
  }

  // App Store Connect states
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

/**
 * Upserts a Google Play App in the database.
 * @param tx - Prisma transaction client
 * @param teamId - The ID of the team
 * @param packageName - The package name (e.g., com.example.app)
 * @param defaultLanguage - Default language code
 */
export async function upsertGooglePlayApp(
  tx: any,
  teamId: string,
  packageName: string,
  defaultLanguage: string = 'en-US'
) {
  // Check if app exists
  const existingApp = await tx.app.findFirst({
    where: {
      storeAppId: packageName,
      teamId: teamId,
      store: 'GOOGLEPLAY',
    },
  });

  if (existingApp) {
    // Update existing app
    return await tx.app.update({
      where: { id: existingApp.id },
      data: {
        primaryLocale: defaultLanguage,
        updatedAt: new Date(),
      },
    });
  }

  // Create new app
  return await tx.app.create({
    data: {
      teamId: teamId,
      store: 'GOOGLEPLAY',
      platform: 'ANDROID',
      storeAppId: packageName,
      primaryLocale: defaultLanguage,
    },
  });
}

/**
 * Upserts a Google Play AppVersion in the database.
 * @param tx - Prisma transaction client
 * @param appId - The ID of the app
 * @param versionCode - Version code (e.g., "123")
 * @param track - Track name (production, beta, alpha, internal)
 * @param status - Release status (completed, inProgress, draft, halted)
 * @param userFraction - Optional rollout percentage
 */
export async function upsertGooglePlayAppVersion(
  tx: any,
  appId: string,
  versionCode: string,
  track: string,
  status: string,
  userFraction?: number
) {
  // Find existing version
  const existingVersion = await tx.appVersion.findFirst({
    where: {
      appId,
      version: versionCode,
      platform: 'ANDROID',
    },
  });

  const versionFields = {
    version: versionCode,
    releaseType: track,
    state: status,
    platform: 'ANDROID',
    // Store user fraction in submission field for staged rollouts
    submission: userFraction ? `rollout:${userFraction}` : '',
  };

  if (existingVersion) {
    // Update existing version
    return await tx.appVersion.update({
      where: {
        id: existingVersion.id,
      },
      data: {
        ...versionFields,
        updatedAt: new Date(),
      },
    });
  }

  // Create new version
  return await tx.appVersion.create({
    data: {
      appId: appId,
      ...versionFields,
    },
  });
}

/**
 * Upserts a Google Play AppLocalization in the database.
 * @param tx - Prisma transaction client
 * @param appId - The ID of the app
 * @param versionId - The ID of the app version
 * @param language - Language code (e.g., "en-US")
 * @param localizationData - Localization data
 */
export async function upsertGooglePlayLocalization(
  tx: any,
  appId: string,
  versionId: string,
  language: string,
  localizationData: {
    title?: string | null;
    shortDescription?: string | null;
    fullDescription?: string | null;
    video?: string | null;
    recentChanges?: string | null;
  }
) {
  // Find existing localization
  const existingLocalization = await tx.appLocalization.findFirst({
    where: {
      appId,
      appVersionId: versionId,
      locale: language,
    },
  });

  const localizationFields = {
    appId,
    appVersionId: versionId,
    locale: language,
    title: localizationData.title,
    shortDescription: localizationData.shortDescription,
    fullDescription: localizationData.fullDescription,
    description: localizationData.fullDescription, // Map to description field
    videoUrl: localizationData.video,
    recentChanges: localizationData.recentChanges,
    whatsNew: localizationData.recentChanges, // Map to whatsNew field
  };

  if (existingLocalization) {
    // Update existing localization
    return await tx.appLocalization.update({
      where: {
        id: existingLocalization.id,
      },
      data: {
        ...localizationFields,
        updatedAt: new Date(),
      },
    });
  }

  // Create new localization
  return await tx.appLocalization.create({
    data: localizationFields,
  });
}
