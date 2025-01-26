import { LocaleCode } from '@/lib/utils/locale';
import { extractKeywordsFromTitleAndDescription } from '@/lib/llm/utils/extract-keywords';
import { getAppLocalization } from './utils';
import { AsoKeyword, KeywordScore, Platform, Store } from '@/types/aso';
import { getTrackedCompetitors } from './manage-competitors';
import prisma from '@/lib/prisma';
import { rerankKeywords } from '@/lib/llm/utils/rerank-keywords';
import { sliceKeywords } from '@/lib/utils/keyword-slice';
import { FIELD_LIMITS } from '@/types/app-store';
import { localeSanityCheck } from '@/lib/llm/utils/locale-sanity-check';
import { generateAsoKeywords } from '@/lib/llm/utils/generate-aso-keywords';
import { BLACKLIST_KEYWORDS } from '../blacklists';
import { scoreKeyword } from '../score';

export async function selectAndScoreKeywords(
  appId: string,
  locale: LocaleCode,
  shortDescription: string,
  store: Store,
  platform: Platform,
  writer?: { write: (data: any) => void }
): Promise<AsoKeyword[]> {
  const MAX_COMPETITORS = 20;
  let TOTAL_STEPS = 5;
  let currentStep = 0;

  const appLocalization = await getAppLocalization(appId, locale);
  const title = appLocalization.title || appLocalization.app?.title || '';

  currentStep++;
  writer?.write({
    type: 'start:extractKeywordsFromCompetitors',
    message: 'Guessing keywords from competitors',
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });
  // Note: Limit to certain number of competitors to avoid rate limiting
  const competitors = (await getTrackedCompetitors(appId, locale)).slice(
    0,
    MAX_COMPETITORS
  );

  // Process competitors in batches of 10 concurrent requests
  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < competitors.length; i += batchSize) {
    const batch = competitors.slice(i, i + batchSize);
    batches.push(batch);
  }

  const allKeywords: string[] = [];
  for (const batch of batches) {
    const batchKeywords = await Promise.all(
      batch.map(async (competitor) => {
        if (competitor.guessedKeywords?.length > 0) {
          // If the competitor already has guessed keywords, use them
          return competitor.guessedKeywords;
        }

        const keywords = await extractKeywordsFromTitleAndDescription(
          competitor?.title || '',
          competitor?.description || '',
          locale
        );

        // Update competitor model with extracted keywords
        await prisma.competitor.update({
          where: { id: competitor.id },
          data: { guessedKeywords: keywords },
        });

        return keywords;
      })
    );
    // Flatten the array of keyword arrays into a single array
    allKeywords.push(...batchKeywords.flat());
  }

  const deduplicatedKeywords = Array.from(new Set(allKeywords));
  writer?.write({
    type: 'end:extractKeywordsFromCompetitors',
    data: deduplicatedKeywords,
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });

  /////////////////////////////////

  currentStep++;
  writer?.write({
    type: 'start:rerankKeywords',
    message: 'Reranking keywords',
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });
  const rerankedKeywords = await rerankKeywords(
    title,
    shortDescription,
    locale,
    deduplicatedKeywords
  );
  let keywordCandidates = sliceKeywords(
    rerankedKeywords,
    FIELD_LIMITS.keywords
  );
  if (keywordCandidates.length < 16) {
    // Some languages have very few keywords, so we need to add more if that's the case
    keywordCandidates = rerankedKeywords.slice(0, 16);
  }
  writer?.write({
    type: 'end:rerankKeywords',
    data: keywordCandidates,
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });

  /////////////////////////////////

  currentStep++;
  writer?.write({
    type: 'start:reviewLanguage',
    message: 'Checking if keywords use the target language',
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });
  const keywordsThatUseTargetLanguage = await localeSanityCheck(
    locale,
    keywordCandidates
  );
  // NOTE: This is a heuristic to check if the keywords are written in the target language.
  // Some minor languages tend to use English keywords, so this is just to detect this case.
  const sanityCheckResult =
    keywordsThatUseTargetLanguage.length >= keywordCandidates.length * 0.8;
  writer?.write({
    type: 'end:reviewLanguage',
    data: {
      sanityCheckResult,
      description: sanityCheckResult
        ? 'The keywords are written in the target language'
        : 'The keywords are not written in the target language',
    },
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });

  if (sanityCheckResult) {
    // If the keywords are written in the target language, continue with the initial keywords
  } else {
    // If the keywords are not written in the target language, generate new keywords
    currentStep++;
    TOTAL_STEPS++;
    writer?.write({
      type: 'start:generateAsoKeywords',
      message:
        'Generating ASO keywords by AI because the initial attempt did not yield enough keywords',
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });
    const keywordsByLlm = await generateAsoKeywords(
      locale,
      title,
      shortDescription
    );
    const filteredKeywords = keywordsByLlm.filter(
      (keyword) => !BLACKLIST_KEYWORDS[locale]?.includes(keyword)
    );
    keywordCandidates = sliceKeywords(filteredKeywords, FIELD_LIMITS.keywords);
    writer?.write({
      type: 'end:generateAsoKeywords',
      data: keywordCandidates,
      step: currentStep,
      totalSteps: TOTAL_STEPS,
    });
  }

  /////////////////////////////////

  // Limit to 1.5x the field limit to account for the fact that some keywords will be removed by the scoring process
  keywordCandidates = sliceKeywords(
    keywordCandidates,
    FIELD_LIMITS.keywords * 1.5
  );

  currentStep++;
  writer?.write({
    type: 'start:scoreKeywords',
    message: 'Scoring keywords',
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });
  const keywordScores = [];
  const scoringBatchSize = 3;
  for (let i = 0; i < keywordCandidates.length; i += scoringBatchSize) {
    const batch = keywordCandidates.slice(i, i + scoringBatchSize);
    const batchScores = await Promise.all(
      batch.map(async (keyword) => {
        const score = await scoreKeyword(locale, keyword, appId);
        writer?.write({ type: 'process:scoreKeyword', data: score });
        return score;
      })
    );
    keywordScores.push(...batchScores);
    if (i + scoringBatchSize < keywordCandidates.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  const finalKeywords = keywordScores.sort(
    (a, b) => (b.overall || 0) - (a.overall || 0)
  );
  const savedKeywordScores = await saveAsoKeywords(
    appId,
    locale,
    finalKeywords,
    store,
    platform
  );

  writer?.write({
    type: 'end:scoreKeywords',
    data: savedKeywordScores,
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });
  currentStep++;
  writer?.write({
    type: 'finalKeywords',
    data: savedKeywordScores,
    step: currentStep,
    totalSteps: TOTAL_STEPS,
  });

  return savedKeywordScores;
}

async function saveAsoKeywords(
  appId: string,
  locale: LocaleCode,
  keywords: KeywordScore[],
  store: Store,
  platform: Platform
) {
  await prisma.asoKeyword.deleteMany({
    where: {
      appId,
      store,
      platform,
      locale,
      keyword: {
        notIn: keywords.map((keyword) => keyword.keyword),
      },
    },
  });

  return await Promise.all(
    keywords.map((keyword) =>
      prisma.asoKeyword.upsert({
        where: {
          appId_store_platform_locale_keyword: {
            appId,
            store,
            platform,
            locale,
            keyword: keyword.keyword,
          },
        },
        create: {
          appId,
          store,
          platform,
          locale,
          keyword: keyword.keyword,
          trafficScore: keyword.trafficScore,
          difficultyScore: keyword.difficultyScore,
          position: keyword.position,
          overall: keyword.overall,
        },
        update: {
          trafficScore: keyword.trafficScore,
          difficultyScore: keyword.difficultyScore,
          position: keyword.position,
          overall: keyword.overall,
        },
      })
    )
  );
}
