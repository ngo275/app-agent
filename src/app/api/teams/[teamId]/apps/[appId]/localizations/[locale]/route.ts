import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import prisma from '@/lib/prisma';
import { addNewLocale as addAppStoreLocale } from '@/lib/app-store-connect/versions';
import { addNewLocale as addGooglePlayLocale } from '@/lib/google-play/versions';
import { LocaleCode } from '@/lib/utils/locale';
import {
  draftVersion,
  publicVersion,
  upsertAppStoreConnectLocalization,
} from '@/lib/utils/versions';
import { Store } from '@/types/aso';
import { getGooglePlayKeyFromDB } from '@/lib/google-play/key';
import { pullLatestVersionFromGooglePlay } from '@/lib/google-play/versions';

// Add a new locale on App Store Connect / Google Play
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: LocaleCode } }
) {
  try {
    const { appStoreConnectJWT, teamId } = await validateTeamAccess(request);
    const { appId, locale } = params;

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
      select: {
        id: true,
        store: true,
        storeAppId: true,
        primaryLocale: true,
      },
    });

    if (!app) {
      throw new AppNotFoundError(`App ${appId} not found`);
    }

    if (app.store === Store.GOOGLEPLAY) {
      // Google Play flow: can add locale to any version (draft or published)
      const serviceAccountKey = await getGooglePlayKeyFromDB(teamId);
      if (!serviceAccountKey) {
        throw new InvalidParamsError(
          'Google Play service account key not found'
        );
      }

      // Add new locale to Google Play Console
      await addGooglePlayLocale(
        teamId,
        appId,
        serviceAccountKey,
        app.storeAppId,
        locale as string,
        (app.primaryLocale as string) || 'en-US'
      );

      return NextResponse.json({ success: true });
    } else {
      // App Store Connect flow: requires draft version
      const appWithVersions = await prisma.app.findFirst({
        where: {
          id: appId,
          teamId: teamId,
        },
        include: {
          versions: {
            where: {
              state: {
                in: [
                  'PREPARE_FOR_SUBMISSION',
                  'REJECTED',
                  'DEVELOPER_REJECTED',
                ],
              },
            },
            take: 1,
          },
        },
      });

      const draftAppVersion = appWithVersions?.versions.find(
        (v) => v.state && draftVersion(v.state)
      );

      if (!draftAppVersion) {
        throw new InvalidParamsError('No draft version found for this app');
      }

      // Add new locale to App Store Connect
      const { versionLocalization, appInfoLocalization } =
        await addAppStoreLocale(
          appStoreConnectJWT,
          draftAppVersion.appInfoId!,
          draftAppVersion.id,
          (app.primaryLocale as LocaleCode) || 'en-US',
          locale as LocaleCode
        );

      await upsertAppStoreConnectLocalization(
        app.id,
        draftAppVersion.id,
        versionLocalization,
        appInfoLocalization
      );

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return handleAppError(error as Error);
  }
}
