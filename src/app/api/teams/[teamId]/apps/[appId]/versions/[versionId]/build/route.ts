import { getBuildsForPreReleaseVersion, selectBuildForVersion } from "@/lib/app-store-connect/submission";
import { NextResponse } from "next/server";
import { validateTeamAccess } from "@/lib/auth";
import { AppNotFoundError, handleAppError } from "@/types/errors";
import prisma from "@/lib/prisma";
import { Store } from "@prisma/client";

// Get builds for a pre-release version
export async function GET(request: Request, { params }: { params: { teamId: string; appId: string; versionId: string } }) {
  try {
    const { teamId, appStoreConnectJWT } = await validateTeamAccess(request);
    const { appId, versionId } = params;

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
      select: {
        id: true,
        store: true,
      },
    });

    if (!app) {
      throw new AppNotFoundError('App not found');
    }

    // Only fetch builds for App Store apps
    // Google Play doesn't have a direct equivalent to pre-release builds
    if (app.store === Store.GOOGLEPLAY) {
      return NextResponse.json([]);
    }

    // Get builds for pre-release version (App Store only)
    const builds = await getBuildsForPreReleaseVersion(appStoreConnectJWT, appId, versionId);

    return NextResponse.json(builds);
  } catch (error) {
    return handleAppError(error as Error);
  }
}

// Select a build for a pre-release version
export async function POST(request: Request, { params }: { params: { teamId: string; appId: string; versionId: string } }) {
  try {
    const { teamId, appStoreConnectJWT } = await validateTeamAccess(request);
    const { appId, versionId } = params;
    const { buildId } = await request.json();

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
      select: {
        id: true,
        store: true,
      },
    });

    if (!app) {
      throw new AppNotFoundError('App not found');
    }

    // Only select builds for App Store apps
    // Google Play doesn't have a direct equivalent to pre-release builds
    if (app.store === Store.GOOGLEPLAY) {
      return NextResponse.json({ success: true });
    }

    // Select build for pre-release version (App Store only)
    const build = await selectBuildForVersion(appStoreConnectJWT, versionId, buildId);

    return NextResponse.json(build);
  } catch (error) {
    return handleAppError(error as Error);
  }
}