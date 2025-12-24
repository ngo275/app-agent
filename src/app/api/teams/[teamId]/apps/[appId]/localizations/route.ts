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

    console.log(
      'Received localizations:',
      JSON.stringify(localizations, null, 2)
    );

    // Get the latest editable version for this app to use as default appVersionId
    // For App Store: draft states (PREPARE_FOR_SUBMISSION, READY_FOR_REVIEW, etc.)
    // For Google Play: draft or completed states (can be edited directly)
    const latestEditableVersion = await prisma.appVersion.findFirst({
      where: {
        appId: appId,
        OR: [
          // App Store draft states
          { state: 'PREPARE_FOR_SUBMISSION' },
          { state: 'DEVELOPER_REMOVED_FROM_SALE' },
          { state: 'WAITING_FOR_REVIEW' },
          { state: 'IN_REVIEW' },
          { state: 'PENDING_DEVELOPER_RELEASE' },
          { state: 'READY_FOR_REVIEW' },
          { state: 'REJECTED' },
          { state: 'METADATA_REJECTED' },
          { state: 'PENDING_CONTRACT' },
          { state: 'WAITING_FOR_EXPORT_COMPLIANCE' },
          // Google Play states
          { state: 'draft' },
          { state: 'completed' },
          { state: 'inProgress' },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latestEditableVersion) {
      throw new InvalidParamsError(
        'No editable version found for this app. Please pull the latest version first.'
      );
    }

    console.log('Using editable version:', latestEditableVersion.id);

    // Get existing localizations from DB to enrich the data if needed
    const existingLocalizations = await prisma.appLocalization.findMany({
      where: {
        appId: appId,
        appVersionId: latestEditableVersion.id,
      },
      select: { id: true, appVersionId: true, locale: true },
    });

    console.log(
      'Existing localizations:',
      JSON.stringify(existingLocalizations, null, 2)
    );

    // Update all localizations - use upsert to handle both create and update
    const updatedLocalizations = await Promise.all(
      localizations.map((localization) => {
        console.log(
          'Processing localization:',
          JSON.stringify(localization, null, 2)
        );

        // Use the editable version ID as default
        const appVersionId =
          localization.appVersionId || latestEditableVersion.id;
        const locale = localization.locale;

        console.log('Using appVersionId:', appVersionId, 'locale:', locale);

        // Validate that we have the minimum required fields
        if (!appVersionId || !locale) {
          throw new InvalidParamsError(
            'Each localization must have locale field'
          );
        }

        const updateData = {
          title: localization.title,
          subtitle: localization.subtitle,
          shortDescription: localization.shortDescription,
          fullDescription: localization.fullDescription,
          privacyPolicyUrl: localization.privacyPolicyUrl,
          privacyChoicesUrl: localization.privacyChoicesUrl,
          privacyPolicyText: localization.privacyPolicyText,
          description: localization.description,
          keywords: localization.keywords,
          marketingUrl: localization.marketingUrl,
          promotionalText: localization.promotionalText,
          supportUrl: localization.supportUrl,
          whatsNew: localization.whatsNew,
        };

        return prisma.appLocalization.upsert({
          where: {
            appVersionId_locale: {
              appVersionId: appVersionId,
              locale: locale,
            },
          },
          update: updateData,
          create: {
            appId: appId,
            appVersionId: appVersionId,
            locale: locale,
            ...updateData,
          },
        });
      })
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
