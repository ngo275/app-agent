import { AppStoreApp } from '@/types/app-store';
import prisma from '@/lib/prisma';
import { LocaleCode } from '@/lib/utils/locale';
import { Store, Platform, Competitor } from '@/types/aso';

/**
 * Adds a competitor to the tracked competitors list
 */
export async function addCompetitor(
  appId: string,
  locale: LocaleCode,
  competitor: Partial<AppStoreApp>,
  store: Store = 'APPSTORE',
  platform: Platform = 'IOS'
): Promise<Competitor> {
  if (!competitor.id) {
    throw new Error('Competitor must have an ID');
  }

  const added = await prisma.competitor.upsert({
    where: {
      appId_locale_competitorId: {
        appId,
        locale,
        competitorId: competitor.id,
      },
    },
    create: {
      appId,
      locale,
      competitorId: competitor.id,
      title: competitor.title || '',
      subtitle: '',
      description: competitor.description || '',
      iconUrl: competitor.icon || '',
      reviews: competitor.reviews || 0,
      store,
    },
    update: {
      title: competitor.title || '',
      subtitle: '',
      description: competitor.description || '',
      reviews: competitor.reviews || 0,
      iconUrl: competitor.icon || '',
    },
  });

  return added;
}

/**
 * Removes a competitor from the tracked competitors list
 */
export async function removeCompetitor(
  appId: string,
  locale: LocaleCode,
  id: string
): Promise<boolean> {
  try {
    await prisma.competitor.delete({
      where: {
        id,
        appId, // Ensure competitor belongs to the specified app
        locale, // Ensure competitor belongs to the specified locale
      },
    });

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * Gets the list of currently tracked competitors
 */
export async function getTrackedCompetitors(
  appId: string,
  locale: LocaleCode
): Promise<Competitor[]> {
  const competitors = await prisma.competitor.findMany({
    where: {
      appId,
      locale,
    },
    orderBy: {
      order: 'asc',
    },
  });

  return competitors;
}

/**
 * Updates the order or other properties of tracked competitors
 */
export async function updateCompetitors(
  appId: string,
  locale: LocaleCode,
  competitors: Competitor[]
): Promise<Competitor[]> {
  // Delete all existing competitors
  await prisma.competitor.deleteMany({
    where: {
      appId,
      locale,
    },
  });

  // Create new competitors in the specified order
  await Promise.all(
    competitors.map((competitor, index) => {
      if (!competitor.id) return Promise.resolve();

      return prisma.competitor.create({
        data: {
          appId,
          locale,
          competitorId: competitor.id,
          title: competitor.title || '',
          subtitle: competitor.subtitle || '',
          description: competitor.description || '',
          iconUrl: competitor.iconUrl || '',
          reviews: competitor.reviews || 0,
          order: index,
          store: competitor.store || 'APPSTORE',
        },
      });
    })
  );

  return competitors;
}
