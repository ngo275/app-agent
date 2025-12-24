import { NextResponse } from 'next/server';
import { checkIfVersionUpToDate as checkAppStoreVersion } from '@/lib/app-store-connect/versions';
import { checkIfVersionUpToDate as checkGooglePlayVersion } from '@/lib/google-play/versions';
import { validateTeamAccess } from '@/lib/auth';
import { getGooglePlayKeyFromDB } from '@/lib/google-play/key';
import {
  AppStoreConnectAgreementError,
  AppError,
  AppErrorType,
  handleAppError,
  InvalidParamsError,
  UnknownError,
} from '@/types/errors';
import prisma from '@/lib/prisma';
import { Store } from '@prisma/client';

export const maxDuration = 20;

// Check if the current database is obsolete compared with the status of App Store Connect or Google Play Console.
export async function GET(
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

    let versionStatus;

    if (app.store === Store.GOOGLEPLAY) {
      // Google Play flow
      const serviceAccountKey = await getGooglePlayKeyFromDB(teamId);
      if (!serviceAccountKey) {
        throw new InvalidParamsError(
          'Google Play service account key not found'
        );
      }

      versionStatus = await checkGooglePlayVersion(
        teamId,
        appId,
        serviceAccountKey,
        app.storeAppId
      );
    } else {
      // App Store Connect flow (default)
      versionStatus = await checkAppStoreVersion(appStoreConnectJWT, appId);
    }

    return NextResponse.json(versionStatus);
  } catch (error) {
    return handleAppError(error as Error);
  }
}
