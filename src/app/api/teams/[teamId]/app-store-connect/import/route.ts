import { NextRequest, NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import { getAppStoreConnectAppList } from '@/lib/app-store-connect/app';
import { pullLatestVersionFromAppStoreConnect } from '@/lib/app-store-connect/versions';
import {
  AppError,
  handleAppError,
  InvalidParamsError,
  UnknownError,
} from '@/types/errors';

export const maxDuration = 180;

// Import a new list of apps.
export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId, appStoreConnectJWT } = await validateTeamAccess(req);
    const { appIds } = await req.json();

    if (!Array.isArray(appIds) || appIds.length === 0) {
      throw new InvalidParamsError('App IDs are required');
    }

    // Fetch all apps from App Store Connect
    const apps = await getAppStoreConnectAppList(appStoreConnectJWT);

    // Filter selected apps based on provided appIds
    const selectedApps = apps.filter((app) => appIds.includes(app.id));

    // Pull latest versions and localizations for each selected app
    for (const app of selectedApps) {
      await pullLatestVersionFromAppStoreConnect(
        appStoreConnectJWT,
        app.id,
        teamId,
        app.attributes.primaryLocale
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error importing apps:', error);
    return handleAppError(error as Error);
  }
}
