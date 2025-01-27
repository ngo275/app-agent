import { LocaleCode } from '@/lib/utils/locale';
import { AppStoreApp } from '@/types/app-store';
import { getSimilarApps } from '@/lib/app-store/similar-apps';
import { searchApps } from '@/lib/app-store/search-apps';
import { filterApps } from '@/lib/llm/utils/filter-apps';
import {
  getCountryCode,
  getLocaleString,
} from '@/lib/app-store/country-mapper';
import { getApp } from '@/lib/app-store/get-app';
import { generateAsoKeywords } from '@/lib/llm/utils/generate-aso-keywords';
import { Competitor, Store } from '@/types/aso';
import { getAppLocalization } from '@/lib/aso/keyword-hunt/utils';
import { InvalidParamsError } from '@/types/errors';
import { addCompetitor } from '@/lib/aso/keyword-hunt/manage-competitors';

interface CompetitorSearchResult {
  competitors: Competitor[];
}

/**
 * Finds competitor apps using multiple strategies
 */
export async function findCompetitors(
  appId: string,
  locale: LocaleCode,
  shortDescription: string,
  writer?: { write: (data: any) => void }
): Promise<CompetitorSearchResult> {
  const TOTAL_STEPS = 6;
  let currentStep = 0;

  const appLocalization = await getAppLocalization(appId, locale);
  const title = appLocalization.title || appLocalization.app?.title || '';
  if (!title) {
    throw new InvalidParamsError(`App title not found`);
  }
  const currentKeywords = (appLocalization.keywords || '')
    .split(/[,、]/)
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
  const competitors = new Map<string, Partial<AppStoreApp>>();

  // First try to get similar apps
  currentStep++;
  writer?.write({
    type: 'start:similarApps',
    message: 'Fetching similar apps from App Store',
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });
  try {
    const similarApps = await getSimilarApps(appId, locale);
    writer?.write({
      type: 'end:similarApps',
      data: similarApps,
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });

    // Add similar apps to competitors map
    similarApps.forEach((app) => {
      if (app.id) {
        competitors.set(app.id, app);
      }
    });
  } catch (error) {
    // Most likely the app is not available in the store yet.
    writer?.write({
      type: 'end:similarApps',
      data: [],
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });
  }

  currentStep++;
  if (competitors.size < 5) {
    // If we don't have enough competitors from similar apps, use title as search term
    writer?.write({
      type: 'start:titleSearch',
      message: 'Searching for competitors using app title',
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });
    const titleSearchResults = await searchApps({
      country: getCountryCode(locale),
      language: getLocaleString(locale),
      term: title.toLowerCase().trim(),
      num: 100,
    });

    titleSearchResults.apps
      .filter((app) => app.id !== appId)
      .slice(0, 10)
      .forEach((app) => {
        if (typeof app !== 'string' && app.id) {
          competitors.set(app.id, app);
        }
      });
    writer?.write({
      type: 'end:titleSearch',
      data: Array.from(competitors.values()),
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });
  }

  currentStep++;
  // If we have current keywords, search for additional competitors
  if (currentKeywords.length > 4) {
    writer?.write({
      type: 'start:searchApps',
      message:
        'Searching for additional competitor apps based on current keywords',
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });

    const keywordSearchResults = await searchCompetitorsByKeywords(
      locale,
      currentKeywords
    );
    writer?.write({
      type: 'end:searchApps',
      data: keywordSearchResults,
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });

    // Add keyword search results to competitors map
    keywordSearchResults.forEach((app) => {
      // Remove apps with less than 5 reviews
      if (app.id && app.reviews && app.reviews > 5) {
        competitors.set(app.id, app);
      }
    });
  } else {
    // Generate keywords
    writer?.write({
      type: 'start:generateKeywords',
      message: 'Generating keywords for competitor search',
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });
    const keywords = await generateAsoKeywords(locale, title, shortDescription);
    const slicedKeywords = keywords.slice(0, 10);
    writer?.write({
      type: 'end:generateKeywords',
      data: slicedKeywords,
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });

    writer?.write({
      type: 'start:searchApps',
      message:
        'Searching for additional competitor apps based on generated keywords',
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });
    const keywordSearchResults = await searchCompetitorsByKeywords(
      locale,
      slicedKeywords
    );
    writer?.write({
      type: 'end:searchApps',
      data: keywordSearchResults,
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });

    // Add keyword search results to competitors map
    keywordSearchResults.forEach((app) => {
      // Remove apps with less than 5 reviews
      if (app.id && app.reviews && app.reviews > 5) {
        competitors.set(app.id, app);
      }
    });
  }

  // Filter competitors by reviews
  currentStep++;
  let reviewFilteredCompetitors: Partial<AppStoreApp>[] = [];
  writer?.write({
    type: 'start:filterAppsByReviews',
    message: 'Excluding competitor apps with fewer reviews than your app',
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });
  try {
    const myApp = await getApp(appId, locale);
    reviewFilteredCompetitors = filterCompetitorsByReviews(
      Array.from(competitors.values()),
      myApp
    ).sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    writer?.write({
      type: 'end:filterAppsByReviews',
      data: reviewFilteredCompetitors,
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });
  } catch (error) {
    // Most likely the app is not available in the store yet.
    writer?.write({
      type: 'end:filterAppsByReviews',
      data: Array.from(competitors.values()),
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });
  }

  // Filter competitors by functionality
  currentStep++;
  writer?.write({
    type: 'start:filterAppsByFunction',
    message: 'Filtering apps based on your app description',
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });
  const functionFilteredCompetitors = await filterCompetitorsByFunction(
    title,
    shortDescription,
    reviewFilteredCompetitors
  );
  writer?.write({
    type: 'end:filterAppsByFunction',
    data: functionFilteredCompetitors.sort(
      (a, b) => (b.reviews || 0) - (a.reviews || 0)
    ),
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });

  // Select top competitors
  const topCompetitors = selectTopCompetitors(functionFilteredCompetitors, 16);

  const savedCompetitors = await saveCompetitors(appId, locale, topCompetitors);
  writer?.write({
    type: 'finalCompetitors',
    data: savedCompetitors,
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });

  return {
    competitors: savedCompetitors,
  };
}

/**
 * Searches for competitor apps using provided keywords
 *
 * This function is designed to handle large numbers of keywords by batching requests and adding a delay between batches.
 * This is to avoid rate limiting and to make the process more efficient.
 */
async function searchCompetitorsByKeywords(
  locale: LocaleCode,
  keywords: string[]
): Promise<Partial<AppStoreApp>[]> {
  const BATCH_SIZE = 5;
  const DELAY_MS = 1000; // 1 second delay between batches
  const results: Partial<AppStoreApp>[][] = [];

  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (keyword) => {
        const result = await searchApps({
          country: getCountryCode(locale),
          language: getLocaleString(locale),
          term: keyword.toLowerCase().trim(),
          num: 100,
        });
        return result.apps.slice(0, 15);
      })
    );
    results.push(...batchResults);

    // Add delay between batches, but not after the last batch
    if (i + BATCH_SIZE < keywords.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return results
    .flat()
    .filter(
      (app): app is Partial<AppStoreApp> =>
        typeof app !== 'string' && app.id !== undefined
    );
}

/**
 * Filters competitors based on number of reviews
 */
function filterCompetitorsByReviews(
  competitors: Partial<AppStoreApp>[],
  myApp: Partial<AppStoreApp>
): Partial<AppStoreApp>[] {
  return competitors.filter(
    (app) => (app.reviews || 0) >= (myApp.reviews || 0)
  );
}

/**
 * Filters competitors based on app functionality using LLM
 */
async function filterCompetitorsByFunction(
  title: string,
  shortDescription: string,
  competitors: Partial<AppStoreApp>[]
): Promise<Partial<AppStoreApp>[]> {
  return await filterApps(title, shortDescription, competitors);
}

/**
 * Selects top N competitors based on review count
 */
function selectTopCompetitors(
  competitors: Partial<AppStoreApp>[],
  count: number
): Partial<AppStoreApp>[] {
  return competitors
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
    .slice(0, count);
}

async function saveCompetitors(
  appId: string,
  locale: LocaleCode,
  competitors: Partial<AppStoreApp>[],
  store: Store = 'APPSTORE'
) {
  return await Promise.all(
    competitors.map((competitor, index) =>
      addCompetitor(appId, locale, competitor, store)
    )
  );
}
