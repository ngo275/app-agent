import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import prisma from '@/lib/prisma';
import { addNewLocale } from '@/lib/app-store-connect/versions';
import { LocaleCode } from '@/lib/utils/locale';
import {
  draftVersion,
  upsertAppStoreConnectLocalization,
} from '@/lib/utils/versions';

// Add a new locale on App Store Connect
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: LocaleCode } }
) {
  try {
    const { appStoreConnectJWT, teamId } = await validateTeamAccess(request);
    const { appId, locale } = params;

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
      include: {
        versions: {
          where: {
            state: {
              in: ['PREPARE_FOR_SUBMISSION', 'REJECTED'],
            },
          },
          take: 1,
        },
      },
    });

    if (!app) {
      throw new AppNotFoundError(`App ${appId} not found`);
    }

    const draftAppVersion = app.versions.find(
      (v) => v.state && draftVersion(v.state)
    );

    if (!draftAppVersion) {
      throw new InvalidParamsError('No draft version found for this app');
    }

    // Add new locale to App Store Connect
    const { versionLocalization, appInfoLocalization } = await addNewLocale(
      appStoreConnectJWT,
      draftAppVersion.appInfoId!,
      draftAppVersion.id,
      (app.primaryLocale as LocaleCode) || 'en-US',
      locale as LocaleCode
    );

    await upsertAppStoreConnectLocalization(
      app.id,
      draftAppVersion.id,
      versionLocalization,
      appInfoLocalization
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
