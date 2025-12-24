import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import { getGooglePlayKeyFromDB } from '@/lib/google-play/key';
import {
  createRelease,
  promoteRelease,
  updateRollout,
  haltRelease,
  getTrackInfo,
} from '@/lib/google-play/release';
import { InvalidParamsError, handleAppError } from '@/types/errors';
import prisma from '@/lib/prisma';
import { Store } from '@prisma/client';

export const maxDuration = 60;

// Create or update a release on Google Play Console
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId } = params;

    // Verify app is a Google Play app
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
        store: Store.GOOGLEPLAY,
      },
    });

    if (!app) {
      throw new InvalidParamsError('Google Play app not found');
    }

    const serviceAccountKey = await getGooglePlayKeyFromDB(teamId);
    if (!serviceAccountKey) {
      throw new InvalidParamsError('Google Play service account key not found');
    }

    const body = await request.json();
    const {
      action,
      track,
      versionCode,
      releaseNotes,
      userFraction,
      status,
      sourceTrack,
      targetTrack,
    } = body;

    if (!action) {
      throw new InvalidParamsError('Action is required');
    }

    let result;

    switch (action) {
      case 'create':
        // Create new release
        if (!track || !versionCode) {
          throw new InvalidParamsError(
            'Track and versionCode are required for create action'
          );
        }
        result = await createRelease(
          serviceAccountKey,
          app.storeAppId,
          track,
          parseInt(versionCode, 10),
          releaseNotes,
          status || 'completed',
          userFraction
        );
        break;

      case 'promote':
        // Promote release from one track to another
        if (!sourceTrack || !targetTrack || !versionCode) {
          throw new InvalidParamsError(
            'sourceTrack, targetTrack, and versionCode are required for promote action'
          );
        }
        result = await promoteRelease(
          serviceAccountKey,
          app.storeAppId,
          sourceTrack,
          targetTrack,
          parseInt(versionCode, 10),
          releaseNotes,
          userFraction
        );
        break;

      case 'updateRollout':
        // Update staged rollout percentage
        if (!track || !versionCode || userFraction === undefined) {
          throw new InvalidParamsError(
            'Track, versionCode, and userFraction are required for updateRollout action'
          );
        }
        result = await updateRollout(
          serviceAccountKey,
          app.storeAppId,
          track,
          parseInt(versionCode, 10),
          userFraction
        );
        break;

      case 'halt':
        // Halt a release
        if (!track || !versionCode) {
          throw new InvalidParamsError(
            'Track and versionCode are required for halt action'
          );
        }
        result = await haltRelease(
          serviceAccountKey,
          app.storeAppId,
          track,
          parseInt(versionCode, 10)
        );
        break;

      default:
        throw new InvalidParamsError(`Unknown action: ${action}`);
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return handleAppError(error as Error);
  }
}

// Get track information
export async function GET(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId } = params;

    // Verify app is a Google Play app
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
        store: Store.GOOGLEPLAY,
      },
    });

    if (!app) {
      throw new InvalidParamsError('Google Play app not found');
    }

    const serviceAccountKey = await getGooglePlayKeyFromDB(teamId);
    if (!serviceAccountKey) {
      throw new InvalidParamsError('Google Play service account key not found');
    }

    // Get track from query params
    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track');

    if (!track) {
      throw new InvalidParamsError('Track parameter is required');
    }

    const trackInfo = await getTrackInfo(
      serviceAccountKey,
      app.storeAppId,
      track as any
    );

    return NextResponse.json(trackInfo);
  } catch (error) {
    return handleAppError(error as Error);
  }
}
