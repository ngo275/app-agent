import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  AppNotFoundError,
  InvalidParamsError,
  handleAppError,
} from '@/types/errors';
import {
  updateLocalization,
  upsertLocalizationInfo,
} from '@/lib/app-store-connect/metadata';
import { FIELD_LIMITS } from '@/types/app-store';
import { draftVersion } from '@/lib/utils/versions';
import { LocaleCode } from '@/lib/utils/locale';

async function validateAppAndTeamAccess(request: Request, appId: string) {
  const { teamId, appStoreConnectJWT } = await validateTeamAccess(request);

  const app = await prisma.app.findFirst({
    where: {
      id: appId,
      teamId,
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
    throw new AppNotFoundError(`App ${appId} not found in this team`);
  }

  const draftAppVersion = app.versions.find(
    (v) => v.state && draftVersion(v.state)
  );

  if (!draftAppVersion) {
    throw new InvalidParamsError('No draft version found for this app');
  }

  return { app, teamId, appStoreConnectJWT, draftAppVersion };
}

function validateMetadataFields(metadata: {
  title?: string;
  subtitle?: string;
  description?: string;
  keywords?: string;
}) {
  const validationErrors = [];

  if (metadata.title && metadata.title.length > FIELD_LIMITS.title) {
    validationErrors.push(
      `Title must be ${FIELD_LIMITS.title} characters or less`
    );
  }

  if (metadata.subtitle && metadata.subtitle.length > FIELD_LIMITS.subtitle) {
    validationErrors.push(
      `Subtitle must be ${FIELD_LIMITS.subtitle} characters or less`
    );
  }

  if (
    metadata.description &&
    metadata.description.length > FIELD_LIMITS.description
  ) {
    validationErrors.push(
      `Description must be ${FIELD_LIMITS.description} characters or less`
    );
  }

  if (metadata.keywords && metadata.keywords.length > FIELD_LIMITS.keywords) {
    validationErrors.push(
      `Keywords must be ${FIELD_LIMITS.keywords} characters or less`
    );
  }

  if (validationErrors.length > 0) {
    throw new InvalidParamsError(validationErrors.join(', '));
  }
}

export async function GET(
  request: Request,
  { params }: { params: { appId: string } }
) {
  try {
    const { app, teamId } = await validateAppAndTeamAccess(
      request,
      params.appId
    );

    const localizations = await prisma.appLocalization.findMany({
      where: {
        appId: app.id,
      },
      include: {
        appVersion: true,
      },
    });

    return NextResponse.json(localizations);
  } catch (error) {
    return handleAppError(error as Error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { appId: string } }
) {
  try {
    const { app, teamId, appStoreConnectJWT, draftAppVersion } =
      await validateAppAndTeamAccess(request, params.appId);

    const { locale, title, subtitle, description, keywords } =
      await request.json();

    if (!locale) {
      throw new InvalidParamsError('Locale is required');
    }

    validateMetadataFields({ title, subtitle, description, keywords });

    const localization = await prisma.appLocalization.findFirst({
      where: {
        appId: app.id,
        appVersionId: draftAppVersion.id,
        locale,
      },
    });

    if (!localization) {
      throw new InvalidParamsError(
        `Localization not found for locale ${locale}`
      );
    }

    const updatedLocalization = await prisma.appLocalization.update({
      where: {
        id: localization.id,
      },
      data: {
        ...(title && { title }),
        ...(subtitle && { subtitle }),
        ...(description && { description }),
        ...(keywords && { keywords }),
      },
    });

    await prisma.app.update({
      where: { id: app.id },
      data: { isStaged: true },
    });

    return NextResponse.json(updatedLocalization);
  } catch (error) {
    return handleAppError(error as Error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { appId: string } }
) {
  try {
    const { app, teamId, appStoreConnectJWT, draftAppVersion } =
      await validateAppAndTeamAccess(request, params.appId);

    const { locale } = await request.json();

    if (!locale) {
      throw new InvalidParamsError('Locale is required');
    }

    const localization = await prisma.appLocalization.findFirst({
      where: {
        appId: app.id,
        appVersionId: draftAppVersion.id,
        locale,
      },
    });

    if (!localization) {
      throw new InvalidParamsError(
        `Localization not found for locale ${locale}`
      );
    }

    if (localization.title) {
      await upsertLocalizationInfo(
        appStoreConnectJWT,
        draftAppVersion.appInfoId || '',
        localization.appInfoLocalizationId || '',
        {
          locale: localization.locale as LocaleCode,
          name: localization.title,
          subtitle: localization.subtitle,
          privacyChoicesUrl: localization.privacyChoicesUrl,
          privacyPolicyText: localization.privacyPolicyText,
          privacyPolicyUrl: localization.privacyPolicyUrl,
        }
      );
    }

    await updateLocalization(appStoreConnectJWT, localization.id, {
      description: localization.description || '',
      keywords: localization.keywords || '',
      marketingUrl: localization.marketingUrl || '',
      promotionalText: localization.promotionalText || '',
      supportUrl: localization.supportUrl || '',
      whatsNew: localization.whatsNew || '',
    });

    await prisma.app.update({
      where: { id: app.id },
      data: { isStaged: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
