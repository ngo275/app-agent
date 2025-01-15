import { extractKeywords, rerankKeywords } from './keyword';
import prisma from '@/lib/prisma';
import { AppError, AppNotFoundError, UnknownError } from '@/types/errors';
import { searchApps } from '@/lib/app-store/search-apps';
import { LocaleCode } from '@/lib/utils/locale';
import {
  getCountryCode,
  getLocaleString,
} from '@/lib/app-store/country-mapper';
import { filterApps } from '@/lib/llm/utils/filter-apps';
import { scoreKeyword } from './score';
import { KeywordScore, Store, Platform, AsoKeyword } from '@/types/aso';
import { AppStoreApp, FIELD_LIMITS } from '@/types/app-store';
import { getSimilarApps } from '@/lib/app-store/similar-apps';
import { getApp } from '@/lib/app-store/get-app';
import { generateAsoKeywords } from '@/lib/llm/utils/generate-aso-keywords';
import {
  keywordFinalSanityCheck,
  localeSanityCheck,
} from '@/lib/llm/utils/locale-sanity-check';
import { sliceKeywords } from '@/lib/utils/keyword-slice';
import { BLACKLIST_KEYWORDS } from '@/lib/aso/blacklists';
import { hasPublicVersion, publicVersion } from '@/lib/utils/versions';

function storeName(store: Store) {
  return store === 'APPSTORE' ? 'App Store' : 'Google Play';
}

export async function suggestKeywords(
  appId: string,
  locale: LocaleCode,
  shortDescription: string,
  store: Store,
  platform: Platform,
  writer?: { write: (data: any) => void }
): Promise<AsoKeyword[]> {
  try {
    writer?.write({ type: 'log', message: 'Starting keyword suggestion' });

    const appLocalization = await getAppLocalization(appId, locale);
    const title = appLocalization.title || appLocalization.app?.title || '';

    const appHasPublicVersion = await hasPublicVersion(appId);
    if (!appHasPublicVersion) {
      return await changeStrategyAndGenerateKeywords(
        appId,
        locale,
        title,
        shortDescription,
        [],
        store,
        platform,
        false,
        writer
      );
    }

    // TODO: Make it work for Google Play as well
    writer?.write({
      type: 'start:similarApps',
      message: `Fetching similar apps from ${storeName(store)}`,
    });
    const similarApps = await getSimilarApps(appId, locale);
    writer?.write({ type: 'end:similarApps', data: similarApps });

    // Fetch competitor apps based on current keywords
    const { keywordScores, competitorApps: competitorAppsFromCurrentKeywords } =
      await processCurrentKeywords(
        appLocalization,
        locale,
        appId,
        similarApps,
        writer
      );

    // Filter competitor apps
    writer?.write({
      type: 'start:filterAppsByReviews',
      message: 'Excluding competitor apps with fewer reviews than your app',
    });
    const myApp = await getApp(appId, locale);
    const competitorApps = filterAppsByReviews(
      competitorAppsFromCurrentKeywords,
      myApp
    );
    writer?.write({ type: 'end:filterAppsByReviews', data: competitorApps });

    writer?.write({
      type: 'start:filterAppsByShortDescription',
      message: 'Filtering apps based on your brief app description',
    });
    const filteredApps = await filterAppsByShortDescription(
      title,
      shortDescription,
      competitorApps
    );
    writer?.write({
      type: 'end:filterAppsByShortDescription',
      data: filteredApps,
    });

    // Select top competitor apps
    const topCompetitorApps = selectTopCompetitorApps(filteredApps, 8);
    writer?.write({ type: 'topCompetitorApps', data: topCompetitorApps });

    if (!topCompetitorApps.length) {
      writer?.write({ type: 'log', message: 'No competitor apps found' });
      return await changeStrategyAndGenerateKeywords(
        appId,
        locale,
        title,
        shortDescription,
        keywordScores,
        store,
        platform,
        false,
        writer
      );
    }

    // Extract keywords from competitor apps
    writer?.write({
      type: 'start:extractKeywordsFromCompetitors',
      message: 'Extracting keywords from competitor apps',
    });
    const extractedKeywords = await extractKeywordsFromCompetitors(
      locale,
      platform,
      topCompetitorApps
    );
    writer?.write({
      type: 'end:extractKeywordsFromCompetitors',
      data: extractedKeywords,
    });

    // Combine and rerank keywords
    const allKeywords = [
      ...extractedKeywords,
      ...keywordScores.map((score) => score.keyword),
    ];

    writer?.write({
      type: 'start:rerankKeywords',
      message: 'Reranking keywords',
    });
    const filteredKeywords = allKeywords.filter(
      (keyword) => !BLACKLIST_KEYWORDS[locale]?.includes(keyword)
    );
    const rerankedKeywords = await rerankKeywords(
      title,
      shortDescription,
      locale,
      filteredKeywords
    );
    writer?.write({ type: 'end:rerankKeywords', data: rerankedKeywords });

    writer?.write({
      type: 'start:reviewLanguage',
      message: 'Checking if keywords use the target language',
    });
    const keywordsThatUseTargetLanguage = await localeSanityCheck(
      locale,
      rerankedKeywords
    );
    // NOTE: This is a heuristic to check if the keywords are written in the target language.
    // Some minor languages tend to use English keywords, so this is just to detect this case.
    const sanityCheckResult =
      keywordsThatUseTargetLanguage.length >= rerankedKeywords.length * 0.8;
    writer?.write({
      type: 'end:reviewLanguage',
      data: {
        sanityCheckResult,
        description: sanityCheckResult
          ? 'The keywords are written in the target language'
          : 'The keywords are not written in the target language',
      },
    });

    if (!rerankedKeywords.length || !sanityCheckResult) {
      return await changeStrategyAndGenerateKeywords(
        appId,
        locale,
        title,
        shortDescription,
        keywordScores,
        store,
        platform,
        false,
        writer
      );
    }

    const slicedRerankedKeywords = sliceKeywords(
      rerankedKeywords,
      FIELD_LIMITS.keywords,
      0.3
    ) as string[];
    // Score new keywords
    writer?.write({
      type: 'start:scoreKeywords',
      message: 'Scoring new keywords',
    });
    const newKeywordScores = await scoreKeywords(
      slicedRerankedKeywords,
      locale,
      appId,
      writer
    );

    // Deduplicate and sort keywords
    const existingKeywords = new Set(
      keywordScores.map((score) => score.keyword)
    );
    keywordScores.push(
      ...newKeywordScores.filter(
        (score) => !existingKeywords.has(score.keyword)
      )
    );

    const sortedKeywordScores = keywordScores
      .filter(
        (score) =>
          !(score.overall && score.overall < 1.5 && score.position === -1)
      )
      .sort((a, b) => (b.overall || 0) - (a.overall || 0));

    writer?.write({ type: 'end:scoreKeywords', data: sortedKeywordScores });

    writer?.write({
      type: 'start:finalSanityCheck',
      message: 'Checking if keywords are good enough to go to the next step',
    });
    const sanityCheckedKeywords = await runFinalSanityCheck(
      locale,
      sortedKeywordScores
    );
    writer?.write({
      type: 'end:finalSanityCheck',
      data: sanityCheckedKeywords,
    });

    const totalCharacterCount = sanityCheckedKeywords.reduce(
      (acc, keyword) => acc + keyword.keyword.length,
      0
    );
    if (totalCharacterCount < FIELD_LIMITS.keywords * 0.8) {
      writer?.write({ type: 'log', message: 'Not enough keywords' });
      return await changeStrategyAndGenerateKeywords(
        appId,
        locale,
        title,
        shortDescription,
        sanityCheckedKeywords,
        store,
        platform,
        true, // disable sanity check because we already checked it
        writer
      );
    }

    const slicedKeywords = sliceKeywords(
      sanityCheckedKeywords,
      FIELD_LIMITS.keywords
    ) as KeywordScore[];
    const finalKeywords = await saveKeywordsToDatabase(
      slicedKeywords,
      appId,
      store,
      platform,
      locale
    );
    const sortedFinalKeywords = finalKeywords.sort(
      (a, b) => (b.overall || 0) - (a.overall || 0)
    );
    writer?.write({ type: 'finalKeywords', data: sortedFinalKeywords });

    return sortedFinalKeywords;
  } catch (error) {
    // Send error event to UI
    writer?.write({
      type: 'error',
      message:
        error instanceof AppError
          ? error.message
          : 'Failed to suggest keywords',
    });

    // Rethrow as appropriate AppError type
    if (error instanceof AppError) {
      throw error;
    }
    throw new UnknownError(
      error instanceof Error ? error.message : 'Failed to suggest keywords'
    );
  }
}

async function changeStrategyAndGenerateKeywords(
  appId: string,
  locale: LocaleCode,
  title: string,
  shortDescription: string,
  existingKeywordScores: KeywordScore[],
  store: Store,
  platform: Platform,
  disableSanityCheck: boolean,
  writer?: { write: (data: any) => void }
): Promise<AsoKeyword[]> {
  try {
    writer?.write({
      type: 'changeStrategy',
      data: {
        description:
          'The keywords found through the initial attempt (by checking competitor apps) did not yield enough keywords, therefore we are going to generate new keywords by AI.',
      },
    });

    const newKeywordScores = await generateAsoKeywordsAndScore(
      appId,
      locale,
      title,
      shortDescription,
      writer
    );

    const dedupedKeywordScores = [
      ...existingKeywordScores,
      ...newKeywordScores,
    ].filter(
      (score, index, self) =>
        self.findIndex((t) => t.keyword === score.keyword) === index
    );

    const sanityCheckedKeywords = disableSanityCheck
      ? dedupedKeywordScores
      : await runFinalSanityCheck(locale, dedupedKeywordScores);
    const slicedKeywords = sliceKeywords(
      sanityCheckedKeywords,
      FIELD_LIMITS.keywords
    ) as KeywordScore[];

    const finalKeywords = await saveKeywordsToDatabase(
      slicedKeywords,
      appId,
      store,
      platform,
      locale
    );

    const sortedFinalKeywords = finalKeywords.sort(
      (a, b) => (b.overall || 0) - (a.overall || 0)
    );
    writer?.write({ type: 'finalKeywords', data: sortedFinalKeywords });

    return sortedFinalKeywords;
  } catch (error) {
    writer?.write({
      type: 'error',
      message: 'Failed to generate alternative keywords',
    });
    throw error;
  }
}

/**
 * Runs a final sanity check on the keywords.
 * @param locale - The locale of the keywords.
 * @param keywords - The keywords to check.
 * @returns The keywords that passed the sanity check after sorting.
 */
async function runFinalSanityCheck(
  locale: LocaleCode,
  keywords: KeywordScore[]
): Promise<KeywordScore[]> {
  const indices = await keywordFinalSanityCheck(
    locale,
    keywords.map((keyword) => keyword.keyword)
  );
  const result = indices
    .map((index) => keywords[index - 1])
    .sort((a, b) => (b.overall || 0) - (a.overall || 0))
    .filter((keyword) => keyword !== null);
  return result;
}

async function generateAsoKeywordsAndScore(
  appId: string,
  locale: LocaleCode,
  title: string,
  shortDescription: string,
  writer?: { write: (data: any) => void }
): Promise<KeywordScore[]> {
  writer?.write({
    type: 'start:generateAsoKeywords',
    message:
      'Generating ASO keywords by AI because the initial attempt did not yield enough keywords',
  });
  const keywordsByLlm = await generateAsoKeywords(
    locale,
    title,
    shortDescription
  );
  const filteredKeywords = keywordsByLlm.filter(
    (keyword) => !BLACKLIST_KEYWORDS[locale]?.includes(keyword)
  );
  const keywords = sliceKeywords(
    filteredKeywords,
    FIELD_LIMITS.keywords,
    0.5
  ) as string[];
  writer?.write({ type: 'end:generateAsoKeywords', data: keywords });

  writer?.write({
    type: 'start:scoreKeywords',
    message: 'Scoring new keywords generated by AI',
  });
  const keywordScores = (
    await scoreKeywords(keywords, locale, appId, writer)
  ).sort((a, b) => (b.overall || 0) - (a.overall || 0));
  writer?.write({ type: 'end:scoreKeywords', data: keywordScores });

  return keywordScores;
}

async function getAppLocalization(appId: string, locale: LocaleCode) {
  const appLocalization = await prisma.appLocalization.findFirst({
    where: {
      appId,
      locale,
      appVersion: {
        state: {
          in: ['PREPARE_FOR_SUBMISSION', 'REJECTED'],
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

async function processCurrentKeywords(
  appLocalization: any,
  locale: LocaleCode,
  appId: string,
  similarApps: Partial<AppStoreApp>[],
  writer?: { write: (data: any) => void }
): Promise<{
  keywordScores: KeywordScore[];
  competitorApps: Partial<AppStoreApp>[];
}> {
  try {
    const keywordScores: KeywordScore[] = [];
    const currentKeywords: string = appLocalization.keywords || '';
    const competitorApps: Partial<AppStoreApp>[] = [...similarApps];

    if (currentKeywords) {
      const keywords = currentKeywords
        .split(/[,、]/)
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0);

      writer?.write({
        type: 'start:scoreCurrentKeywords',
        message: `Scoring current keywords: ${keywords.join(', ')}`,
      });
      const currentKeywordScores = await Promise.all(
        keywords.map((keyword) => scoreKeyword(locale, keyword, appId))
      );
      writer?.write({
        type: 'end:scoreCurrentKeywords',
        data: currentKeywordScores,
      });

      const highScoringCurrentKeywords = currentKeywordScores.filter(
        (score) => score.overall && score.overall >= 3
      );
      writer?.write({
        type: 'highScoringCurrentKeywords',
        data: highScoringCurrentKeywords,
      });

      keywordScores.push(...highScoringCurrentKeywords);

      writer?.write({
        type: 'start:searchApps',
        message:
          'Searching for additional competitor apps based on your current keywords',
      });
      const searchResults = await Promise.all(
        keywords.map(async (keyword) => {
          const searchResult = await searchApps({
            country: getCountryCode(locale),
            language: getLocaleString(locale),
            term: keyword.toLowerCase().trim(),
            num: 100,
          });
          return searchResult.apps.slice(0, 10);
        })
      );
      const popularApps = searchResults.flat();
      writer?.write({ type: 'end:searchApps', data: popularApps });

      const seenAppIds = new Set(competitorApps.map((app) => app.id));
      for (const app of popularApps) {
        if (typeof app === 'string') continue;
        if (!seenAppIds.has(app.id)) {
          competitorApps.push(app);
          seenAppIds.add(app.id);
        }
      }
    }

    return {
      keywordScores,
      competitorApps,
    };
  } catch (error) {
    writer?.write({
      type: 'error',
      message: 'Failed to process current keywords',
    });
    throw error;
  }
}

function filterAppsByReviews(
  appsToCompare: Partial<AppStoreApp>[],
  myApp: Partial<AppStoreApp>
): Partial<AppStoreApp>[] {
  return appsToCompare.filter(
    (app) => (app.reviews || 0) >= (myApp.reviews || 0)
  );
}

async function filterAppsByShortDescription(
  title: string,
  shortDescription: string,
  apps: Partial<AppStoreApp>[]
): Promise<Partial<AppStoreApp>[]> {
  return await filterApps(title, shortDescription, apps);
}

function selectTopCompetitorApps(
  apps: Partial<AppStoreApp>[],
  n: number
): Partial<AppStoreApp>[] {
  return apps.sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, n);
}

async function extractKeywordsFromCompetitors(
  locale: LocaleCode,
  platform: Platform,
  apps: Partial<AppStoreApp>[]
): Promise<string[]> {
  const keywordPromises = apps.map((app) =>
    extractKeywords(
      locale.toString(),
      platform,
      app.id || '',
      app.title || '',
      app.description || ''
    )
  );
  const keywordResults = await Promise.all(keywordPromises);
  return keywordResults.flat();
}

async function saveKeywordsToDatabase(
  keywordScores: KeywordScore[],
  appId: string,
  store: Store,
  platform: Platform,
  locale: LocaleCode
): Promise<AsoKeyword[]> {
  await prisma.asoKeyword.deleteMany({
    where: {
      appId,
      store,
      platform,
      locale,
      keyword: {
        notIn: keywordScores.map((score) => score.keyword),
      },
    },
  });

  return await Promise.all(
    keywordScores.map((score) =>
      prisma.asoKeyword.upsert({
        where: {
          appId_store_platform_locale_keyword: {
            appId,
            store,
            platform,
            locale,
            keyword: score.keyword,
          },
        },
        create: {
          appId,
          store,
          platform,
          locale,
          keyword: score.keyword,
          trafficScore: score.trafficScore,
          difficultyScore: score.difficultyScore,
          position: score.position,
          overall: score.overall,
        },
        update: {
          trafficScore: score.trafficScore,
          difficultyScore: score.difficultyScore,
          position: score.position,
          overall: score.overall,
        },
      })
    )
  );
}

async function scoreKeywords(
  keywords: string[],
  locale: LocaleCode,
  appId: string,
  writer?: { write: (data: any) => void }
): Promise<KeywordScore[]> {
  const scores: KeywordScore[] = [];
  for (const keyword of keywords) {
    const score = await scoreKeyword(locale, keyword, appId);
    writer?.write({ type: 'process:scoreKeyword', data: score });
    if (score.trafficScore === 0 && score.difficultyScore === 0) continue;
    scores.push(score);
    if (!score.cacheHit) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
    }
  }
  return scores;
}
