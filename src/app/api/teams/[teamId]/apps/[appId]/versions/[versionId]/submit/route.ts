import { validateTeamAccess } from '@/lib/auth';
import { AppNotFoundError, handleAppError } from '@/types/errors';
import { submitAppForReview } from '@/lib/app-store-connect/submission';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { pullLatestVersionFromAppStoreConnect } from '@/lib/app-store-connect/versions';
import { LocaleCode } from '@/lib/utils/locale';

export const maxDuration = 180;

// Submit a pre-release version for review
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string; versionId: string } }
) {
  try {
    const { teamId, appStoreConnectJWT } = await validateTeamAccess(request);
    const { appId, versionId } = params;

    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
    });

    if (!app) {
      throw new AppNotFoundError('App not found');
    }

    await submitAppForReview(
      appStoreConnectJWT,
      appId,
      versionId,
      app.platform
    );

    await pullLatestVersionFromAppStoreConnect(
      appStoreConnectJWT,
      appId,
      teamId,
      app.primaryLocale as LocaleCode
    );

    return NextResponse.json({ message: 'App submitted for review' });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
