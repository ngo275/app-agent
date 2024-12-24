import { NextResponse } from 'next/server';
import {
  createNewVersion,
  pullLatestVersionFromAppStoreConnect,
} from '@/lib/app-store-connect/versions';
import { validateTeamAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { InvalidParamsError, handleAppError } from '@/types/errors';
import { Platform } from '@/types/aso';
import { AppStoreState } from '@/types/app-store';

// Crete a new version on App Store Connect / Google Play
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

    // TODO: make it store agnostic
    // Create the new version in App Store Connect
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
  } catch (error) {
    return handleAppError(error as Error);
  }
}
