import { App } from '@/types/aso';
import { generateShortDescription as generateShortDescriptionWithLlm } from '@/lib/llm/utils/generate-short-description';
import { publicVersion } from '../utils/versions';
import prisma from '@/lib/prisma';
import {
  AppNotFoundError,
  MissingRequiredPropertiesError,
  ShortDescriptionGenerationError,
} from '@/types/errors';

export async function generateShortDescription(appId: string, teamId: string) {
  if (!appId || !teamId) {
    throw new MissingRequiredPropertiesError('App ID and team ID are required');
  }

  const app = await prisma.app.findUnique({
    where: {
      id: appId,
      teamId: teamId,
    },
    include: {
      versions: true,
      localizations: true,
    },
  });
  if (!app) {
    throw new AppNotFoundError('App not found');
  }

  if (app.shortDescription) {
    console.log('Short description already exists in the database');
    return app.shortDescription;
  }

  const publicVersionData = app.versions.find(
    (v) => v.state && publicVersion(v.state)
  );
  let shortDescription = '';
  if (publicVersionData) {
    const localization = app.localizations.find(
      (l) =>
        l.locale === app.primaryLocale &&
        l.appVersionId === publicVersionData.id
    );
    shortDescription =
      (await generateShortDescriptionWithLlm(
        localization?.title || '',
        localization?.description || ''
      )) || '';
  } else {
    const localization = app.localizations.find(
      (l) => l.locale === app.primaryLocale
    );
    shortDescription =
      (await generateShortDescriptionWithLlm(
        localization?.title || '',
        localization?.description || ''
      )) || '';
  }

  if (!shortDescription) {
    throw new ShortDescriptionGenerationError(
      'Short description generation failed'
    );
  }

  // Cache the short description in the database
  await prisma.app.update({
    where: { id: appId },
    data: { shortDescription },
  });

  return shortDescription;
}
