import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  InvalidParamsError,
  handleAppError,
} from '@/types/errors';
import prisma from '@/lib/prisma';
import {
  updateLocalization,
  upsertLocalizationInfo,
} from '@/lib/app-store-connect/metadata';

export const maxDuration = 60;

// Update App Store Connect with the data in the database.
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { teamId, appStoreConnectJWT } = await validateTeamAccess(request);
    const { appId } = params;

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

    // Get version string from request body
    const body = await request.json();
    const { versionId } = body;

    if (!versionId) {
      throw new InvalidParamsError('Version ID is required');
    }

    const localizations = await prisma.appLocalization.findMany({
      where: {
        appVersionId: versionId,
      },
      include: {
        appVersion: true,
      },
    });

    // TODO: support multiple platforms
    // Push each localization to App Store Connect
    const updatePromises = localizations.map(async (localization) => {
      if (!localization.appVersion.appInfoId) {
        return;
      }
      if (!localization.locale && !localization.description) {
        return;
      }

      if (localization.title) {
        // TODO: Remove commentout
        const result = await upsertLocalizationInfo(
          appStoreConnectJWT,
          localization.appVersion.appInfoId,
          localization.appInfoLocalizationId || '',
          {
            locale: localization.locale || 'en-US',
            name: localization.title,
            subtitle: localization.subtitle,
            privacyChoicesUrl: localization.privacyChoicesUrl,
            privacyPolicyText: localization.privacyPolicyText,
            privacyPolicyUrl: localization.privacyPolicyUrl,
          }
        );

        if (result && result.id) {
          await prisma.appLocalization.update({
            where: { id: localization.id },
            data: { appInfoLocalizationId: result.id },
          });
        }
      }

      return updateLocalization(appStoreConnectJWT, localization.id, {
        // locale: localization.locale || 'en-US',
        description: localization.description || '',
        keywords: localization.keywords || '',
        marketingUrl: localization.marketingUrl || '',
        promotionalText: localization.promotionalText || '',
        supportUrl: localization.supportUrl || '',
        whatsNew: localization.whatsNew || '',
      });
    });

    // NOTE: it should have throttling logic or something like that to avoid API rate limit
    await Promise.all(updatePromises);

    // Update app info
    await prisma.app.update({
      where: { id: appId },
      data: { isStaged: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
