import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import { pullLatestVersionFromAppStoreConnect } from '@/lib/app-store-connect/versions';
import { pullLatestVersionFromGooglePlay } from '@/lib/google-play/versions';
import { getGooglePlayKeyFromDB } from '@/lib/google-play/key';
import {
  UnauthorizedError,
  NotPermittedError,
  InvalidParamsError,
  handleAppError,
} from '@/types/errors';
import prisma from '@/lib/prisma';
import { Store } from '@prisma/client';

export const maxDuration = 60;

// Fetch the latest data from App Store Connect or Google Play Console and save it into the database.
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { appStoreConnectJWT, teamId } = await validateTeamAccess(request);
    const { appId } = params;

    if (!appId) {
      throw new InvalidParamsError('App ID is required');
    }

    // Get app from database to determine store
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { store: true, storeAppId: true },
    });

    if (!app) {
      throw new InvalidParamsError('App not found');
    }

    if (app.store === Store.GOOGLEPLAY) {
      // Google Play flow
      const serviceAccountKey = await getGooglePlayKeyFromDB(teamId);
      if (!serviceAccountKey) {
        throw new InvalidParamsError(
          'Google Play service account key not found'
        );
      }

      await pullLatestVersionFromGooglePlay(
        teamId,
        appId,
        serviceAccountKey,
        app.storeAppId
      );
    } else {
      // App Store Connect flow (default)
      await pullLatestVersionFromAppStoreConnect(
        appStoreConnectJWT,
        appId,
        teamId
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
