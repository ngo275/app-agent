import { NextResponse } from 'next/server';
import {
  createNewVersion,
  pullLatestVersionFromAppStoreConnect,
} from '@/lib/app-store-connect/versions';
import { validateTeamAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  InvalidParamsError,
  handleAppError,
  AppNotFoundError,
} from '@/types/errors';
import { Platform, Store } from '@/types/aso';
import { AppStoreState } from '@/types/app-store';
import { getGooglePlayKeyFromDB } from '@/lib/google-play/key';
import { pullLatestVersionFromGooglePlay } from '@/lib/google-play/versions';

// Create a new version on App Store Connect / Google Play
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { userId, teamId, session, appStoreConnectJWT } =
      await validateTeamAccess(request);
    const { appId } = params;
    const { versionString } = await request.json();

    if (!versionString || !appId) {
      throw new InvalidParamsError('Version string and app ID are required');
    }

    // Get app to determine store type
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { store: true, storeAppId: true },
    });

    if (!app) {
      throw new AppNotFoundError('App not found');
    }

    if (app.store === Store.GOOGLEPLAY) {
      // For Google Play, we need to create a release on a track using an existing versionCode
      // The versionCode must already exist (uploaded as APK/Bundle)
      const serviceAccountKey = await getGooglePlayKeyFromDB(teamId);
      if (!serviceAccountKey) {
        throw new InvalidParamsError(
          'Google Play service account key not found'
        );
      }

      // First, sync latest version to ensure we have the latest data
      await pullLatestVersionFromGooglePlay(
        teamId,
        appId,
        serviceAccountKey,
        app.storeAppId
      );

      return NextResponse.json({
        message:
          'Latest version synced from Google Play Console. To create a new release, use the release endpoint with an existing version code.',
      });
    } else {
      // App Store Connect flow
      const newVersion = await createNewVersion(
        appStoreConnectJWT,
        appId,
        versionString
      );

      await pullLatestVersionFromAppStoreConnect(
        appStoreConnectJWT,
        appId,
        teamId
      );

      return NextResponse.json({ message: 'Version created successfully' });
    }
  } catch (error) {
    return handleAppError(error as Error);
  }
}
