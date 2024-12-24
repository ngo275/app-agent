import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppStoreConnectAppsError,
  AppError,
  handleAppError,
  UnauthorizedError,
  StoreConnectionNotFoundError,
} from '@/types/errors';
import { getAppStoreConnectAppList } from '@/lib/app-store-connect/app';

// Retrieve the latest app data from App Store Connect.
export async function GET(request: Request) {
  try {
    const { userId, teamId, session, team, appStoreConnectJWT } =
      await validateTeamAccess(request);

    // Check if JWT exists in session and is not expired
    if (
      !team.appStoreConnectIssuerId ||
      !team.appStoreConnectKeyId ||
      !team.appStoreConnectPrivateKey
    ) {
      throw new StoreConnectionNotFoundError(
        'App Store Connect is not configured for this team'
      );
    }

    // Fetch apps from App Store Connect API
    const appsData = await getAppStoreConnectAppList(appStoreConnectJWT);
    return NextResponse.json(appsData);
  } catch (error) {
    console.error('Error fetching App Store Connect apps:', error);
    return handleAppError(error as Error);
  }
}
