import { LocaleCode } from '@/lib/utils/locale';
import { AppNotFoundError } from '@/types/errors';
import prisma from '@/lib/prisma';
import { AppLocalization } from '@/types/aso';

export async function getAppLocalization(
  appId: string,
  locale: LocaleCode | string
): Promise<AppLocalization> {
  // First try to get the app to determine the store type
  const app = await prisma.app.findUnique({
    where: { id: appId },
  });

  if (!app) {
    throw new AppNotFoundError(`App ${appId} not found`);
  }

  // Define valid states based on store type
  const validStates =
    app.store === 'GOOGLEPLAY'
      ? ['draft', 'completed', 'inProgress'] // Google Play states
      : ['PREPARE_FOR_SUBMISSION', 'REJECTED', 'DEVELOPER_REJECTED']; // App Store states

  const appLocalization = await prisma.appLocalization.findFirst({
    where: {
      appId,
      locale,
      appVersion: {
        state: {
          in: validStates,
        },
      },
    },
    include: {
      app: true,
      appVersion: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (!appLocalization) {
    throw new AppNotFoundError(`App localization ${appId} ${locale} not found`);
  }

  return appLocalization;
}
