import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  InvalidParamsError,
  handleAppError,
} from '@/types/errors';
import prisma from '@/lib/prisma';
import {
  updateLocalization as updateAppStoreLocalization,
  upsertLocalizationInfo,
} from '@/lib/app-store-connect/metadata';
import {
  updateListing as updateGooglePlayListing,
  updateMultipleListings as updateGooglePlayMultipleListings,
} from '@/lib/google-play/metadata';
import { getGooglePlayKeyFromDB } from '@/lib/google-play/key';
import { hasPublicVersion } from '@/lib/utils/versions';
import { Store } from '@prisma/client';

export const maxDuration = 60;

// Update App Store Connect or Google Play Console with the data in the database.
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { teamId, appStoreConnectJWT } = await validateTeamAccess(request);
    const { appId } = params;

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
      select: { id: true, store: true, storeAppId: true, isStaged: true },
    });

    if (!app) {
      throw new AppNotFoundError('App not found');
    }

    // Get version string from request body
    const body = await request.json();
    const { versionId } = body;

    if (!versionId) {
      throw new InvalidParamsError('Version ID is required');
    }

    const localizations = await prisma.appLocalization.findMany({
      where: {
        appVersionId: versionId,
      },
      include: {
        appVersion: true,
      },
    });

    if (app.store === Store.GOOGLEPLAY) {
      // Google Play flow
      const serviceAccountKey = await getGooglePlayKeyFromDB(teamId);
      if (!serviceAccountKey) {
        throw new InvalidParamsError(
          'Google Play service account key not found'
        );
      }

      // Prepare all listings for a single edit session
      const listingsToUpdate = localizations
        .filter((loc) => loc.locale) // Only include localizations with a locale
        .map((localization) => ({
          language: localization.locale!,
          title: localization.title || undefined,
          shortDescription: localization.shortDescription || undefined,
          fullDescription:
            localization.fullDescription ||
            localization.description ||
            undefined,
          video: localization.videoUrl || undefined,
        }));

      // Update all listings in a single edit session
      await updateGooglePlayMultipleListings(
        serviceAccountKey,
        app.storeAppId,
        listingsToUpdate
      );
    } else {
      // App Store Connect flow (default)
      const updatePromises = localizations.map(async (localization) => {
        if (!localization.appVersion.appInfoId) {
          return;
        }
        if (!localization.locale && !localization.description) {
          return;
        }

        if (localization.title) {
          const result = await upsertLocalizationInfo(
            appStoreConnectJWT,
            localization.appVersion.appInfoId,
            localization.appInfoLocalizationId || '',
            {
              locale: localization.locale || 'en-US',
              name: localization.title,
              subtitle: localization.subtitle,
              privacyChoicesUrl: localization.privacyChoicesUrl,
              privacyPolicyText: localization.privacyPolicyText,
              privacyPolicyUrl: localization.privacyPolicyUrl,
            }
          );

          if (result && result.id) {
            await prisma.appLocalization.update({
              where: { id: localization.id },
              data: { appInfoLocalizationId: result.id },
            });
          }
        }

        const appHasPublicVersion = await hasPublicVersion(appId);

        return updateAppStoreLocalization(appStoreConnectJWT, localization.id, {
          description: localization.description || '',
          keywords: localization.keywords || '',
          marketingUrl: localization.marketingUrl || '',
          promotionalText: localization.promotionalText || '',
          supportUrl: localization.supportUrl || '',
          // This is not editable in App Store Connect if it is the first public version
          whatsNew: appHasPublicVersion
            ? localization.whatsNew || ''
            : undefined,
        });
      });

      // NOTE: it should have throttling logic or something like that to avoid API rate limit
      await Promise.all(updatePromises);
    }

    // Update app info
    await prisma.app.update({
      where: { id: appId },
      data: { isStaged: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
