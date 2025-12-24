import { NextRequest, NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import { getGooglePlayKeyFromDB } from '@/lib/google-play/key';
import { getGooglePlayAppsByPackageNames } from '@/lib/google-play/app';
import { handleAppError, InvalidParamsError } from '@/types/errors';
import prisma from '@/lib/prisma';
import { Platform, Store } from '@prisma/client';

export const maxDuration = 180;

// Import apps from Google Play Console
export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(req);
    const { appIds, packageNames, fetchDetails } = await req.json();

    // Get service account key from database
    const serviceAccountKey = await getGooglePlayKeyFromDB(teamId);

    if (!serviceAccountKey) {
      throw new InvalidParamsError(
        'Google Play service account key not found. Please upload your service account key first.'
      );
    }

    // If packageNames are provided, use them. Otherwise use appIds as package names
    const packages = packageNames || appIds;

    if (!Array.isArray(packages) || packages.length === 0) {
      throw new InvalidParamsError('Package names or app IDs are required');
    }

    // Fetch app details for each package
    const apps = await getGooglePlayAppsByPackageNames(
      serviceAccountKey,
      packages
    );

    // Import each app to the database
    for (const app of apps) {
      // Check if app already exists
      const existingApp = await prisma.app.findFirst({
        where: {
          storeAppId: app.appId,
          teamId: teamId,
          store: Store.GOOGLEPLAY,
        },
      });

      if (existingApp) {
        // Update existing app
        await prisma.app.update({
          where: { id: existingApp.id },
          data: {
            title: app.title,
            iconUrl: app.icon,
            primaryLocale: app.defaultLanguage,
          },
        });
      } else {
        // Create new app
        await prisma.app.create({
          data: {
            storeAppId: app.appId,
            teamId: teamId,
            store: Store.GOOGLEPLAY,
            platform: Platform.ANDROID,
            title: app.title,
            iconUrl: app.icon,
            primaryLocale: app.defaultLanguage,
          },
        });
      }
    }

    // If fetchDetails is true, return the app details for display
    if (fetchDetails) {
      return NextResponse.json({ success: true, apps }, { status: 200 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error importing Google Play apps:', error);
    return handleAppError(error as Error);
  }
}
