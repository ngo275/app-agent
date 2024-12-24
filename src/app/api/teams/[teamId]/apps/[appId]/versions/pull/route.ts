import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import { pullLatestVersionFromAppStoreConnect } from '@/lib/app-store-connect/versions';
import {
  UnauthorizedError,
  NotPermittedError,
  InvalidParamsError,
  handleAppError,
} from '@/types/errors';

export const maxDuration = 60;

// Fetch the latest data from App Store Connect and save it into the database.
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

    // TODO: support multiple platforms
    await pullLatestVersionFromAppStoreConnect(
      appStoreConnectJWT,
      appId,
      teamId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
