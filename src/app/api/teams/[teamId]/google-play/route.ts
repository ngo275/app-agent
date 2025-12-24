import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import { handleAppError, InvalidParamsError } from '@/types/errors';
import { getGooglePlayKeyFromDB } from '@/lib/google-play/key';
import { getGooglePlayAppList } from '@/lib/google-play/app';

// Retrieve the list of apps from Google Play Console
export async function GET(request: Request) {
  try {
    const { userId, teamId, session, team } = await validateTeamAccess(request);

    // Check if Google Play credentials exist
    const serviceAccountKey = await getGooglePlayKeyFromDB(teamId);

    if (!serviceAccountKey) {
      throw new InvalidParamsError(
        'Google Play service account key not found. Please upload your service account key first.'
      );
    }

    // Get list of apps (note: this may return empty array due to API limitations)
    const apps = await getGooglePlayAppList(serviceAccountKey);

    return NextResponse.json(apps);
  } catch (error) {
    console.error('Error fetching Google Play apps:', error);
    return handleAppError(error as Error);
  }
}
