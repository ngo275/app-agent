import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  UnauthorizedError,
  NotPermittedError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import prisma from '@/lib/prisma';
import { draftVersion, publicVersion } from '@/lib/utils/versions';
import { AppLocalization } from '@/types/aso';

// Retrieve localization info from the database.
// To retrieve the latest localization from App Store Connect, `pull` endpoint must be used first.
export async function GET(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId } = params;

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
    });

    if (!app) {
      throw new AppNotFoundError(`App ${appId} not found`);
    }

    console.log(`going to fetch localizations for app ${appId}`);

    const localizations = (await prisma.appLocalization.findMany({
      where: {
        appId: appId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        appVersion: true,
      },
    })) as AppLocalization[];

    // Zip localizations by locale
    const zippedLocalizations = localizations.reduce(
      (
        acc: Record<
          string,
          { public?: AppLocalization; draft?: AppLocalization }
        >,
        curr: AppLocalization
      ) => {
        if (!acc[curr.locale]) {
          acc[curr.locale] = {};
        }
        if (publicVersion(curr.appVersion?.state || '')) {
          if (!acc[curr.locale].public) {
            acc[curr.locale].public = curr;
          }
        } else if (draftVersion(curr.appVersion?.state || '')) {
          if (!acc[curr.locale].draft) {
            acc[curr.locale].draft = curr;
          }
        }
        return acc;
      },
      {}
    );

    return NextResponse.json(zippedLocalizations);
  } catch (error) {
    return handleAppError(error as Error);
  }
}

// Update the localization data on the database (not to App Store Connect)
// Updating App Store Connect will be done in the `push` endpoint.
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId } = params;

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
    });

    if (!app) {
      throw new AppNotFoundError(`App ${appId} not found`);
    }

    // Get localization data from request body
    const localizations: AppLocalization[] = await request.json();

    if (!Array.isArray(localizations)) {
      throw new InvalidParamsError(
        'Request body must be an array of localizations'
      );
    }

    // Update all localizations
    const updatedLocalizations = await Promise.all(
      localizations.map((localization) =>
        prisma.appLocalization.update({
          where: {
            id: localization.id,
          },
          data: {
            title: localization.title,
            subtitle: localization.subtitle,
            privacyPolicyUrl: localization.privacyPolicyUrl,
            privacyChoicesUrl: localization.privacyChoicesUrl,
            privacyPolicyText: localization.privacyPolicyText,
            description: localization.description,
            keywords: localization.keywords,
            marketingUrl: localization.marketingUrl,
            promotionalText: localization.promotionalText,
            supportUrl: localization.supportUrl,
            whatsNew: localization.whatsNew,
          },
        })
      )
    );

    // Update app info
    await prisma.app.update({
      where: { id: appId },
      data: { isStaged: true },
    });

    return NextResponse.json(updatedLocalizations);
  } catch (error) {
    return handleAppError(error as Error);
  }
}
