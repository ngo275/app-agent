import { getBuildsForPreReleaseVersion, selectBuildForVersion } from "@/lib/app-store-connect/submission";
import { NextResponse } from "next/server";
import { validateTeamAccess } from "@/lib/auth";
import { AppNotFoundError, handleAppError } from "@/types/errors";
import prisma from "@/lib/prisma";

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
    });

    if (!app) {
      throw new AppNotFoundError('App not found');
    }

    // Get builds for pre-release version
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
    });

    if (!app) {
      throw new AppNotFoundError('App not found');
    }

    // Select build for pre-release version
    const build = await selectBuildForVersion(appStoreConnectJWT, versionId, buildId);

    return NextResponse.json(build);
  } catch (error) {
    return handleAppError(error as Error);
  }
}