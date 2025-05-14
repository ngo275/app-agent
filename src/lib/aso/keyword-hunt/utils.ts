import { LocaleCode } from '@/lib/utils/locale';
import { AppNotFoundError } from '@/types/errors';
import prisma from '@/lib/prisma';
import { AppLocalization } from '@/types/aso';

export async function getAppLocalization(
  appId: string,
  locale: LocaleCode
): Promise<AppLocalization> {
  const appLocalization = await prisma.appLocalization.findFirst({
    where: {
      appId,
      locale,
      appVersion: {
        state: {
          in: ['PREPARE_FOR_SUBMISSION', 'REJECTED', 'DEVELOPER_REJECTED'],
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
