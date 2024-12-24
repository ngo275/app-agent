import { LocaleCode } from '@/lib/utils/locale';
import {
  getCountryCode,
  getLocaleString,
} from '@/lib/app-store/country-mapper';
import { KeywordScore } from '@/types/aso';
import { searchApps } from '../app-store/search-apps';
import { AppStoreApp } from '@/types/app-store';

function calculateScores(
  apps: Partial<AppStoreApp>[],
  myAppId: string,
  keyword: string
) {
  // Find app position in the search results
  const positionIndex = apps.findIndex((app) => app.id === myAppId);
  const position = positionIndex !== -1 ? positionIndex + 1 : -1; // Convert to 1-based index or -1 if not found

  const topApps = apps.slice(0, 10); // Analyze the top 10 apps
  const maxReviews = 1_000_000; // Cap for logarithmic normalization

  // Calculate Traffic Score
  const totalTopReviews = topApps.reduce(
    (sum, app) => sum + (app.reviews ?? 0),
    0
  );
  const avgTopReviews = totalTopReviews / topApps.length || 0; // Avoid division by zero
  const trafficScore = Math.min(
    10,
    (Math.log10(avgTopReviews + 1) / Math.log10(maxReviews + 1)) * 10
  );

  // Calculate Keyword Competition Score based on keyword density
  const keywordLower = keyword.toLowerCase();
  const keywordRegex = new RegExp(`\\b${keywordLower}\\b`, 'i');
  const appsUsingKeyword = topApps.filter((app) => {
    const title = app.title?.toLowerCase() || '';
    const description = app.description ? app.description.toLowerCase() : '';
    return keywordRegex.test(title) || keywordRegex.test(description);
  });
  const keywordUsageRate = topApps.length
    ? appsUsingKeyword.length / topApps.length
    : 0;
  const keywordCompetitionScore = keywordUsageRate * 10; // Scale to 0-10

  // Calculate Difficulty Score with keyword competition included
  const avgTopRating =
    topApps.reduce((sum, app) => sum + (app.score ?? 0), 0) / topApps.length ||
    0;
  const avgTopRatingComponent = (avgTopRating / 5) * 10; // Scale to 0-10
  const avgTopReviewsComponent = trafficScore; // Reuse trafficScore

  // Assign weights to each component
  const ratingWeight = 0.4;
  const reviewsWeight = 0.3;
  const keywordCompetitionWeight = 0.3;

  const difficultyScore = Math.min(
    10,
    avgTopRatingComponent * ratingWeight +
      avgTopReviewsComponent * reviewsWeight +
      keywordCompetitionScore * keywordCompetitionWeight
  );

  // Calculate Position Score (nonlinear scale for better ranking differentiation)
  const positionScore =
    position > 0 ? Math.max(0, 10 - Math.log2(position)) : 0;

  // Normalize scores to 0-1 scale
  const normalizedPositionScore = positionScore / 10;
  const normalizedDifficultyScore = difficultyScore / 10;

  // Calculate Ranking Reward Factor
  const rankingReward =
    normalizedPositionScore * normalizedDifficultyScore * 10; // Scale back to 0-10

  // Adjust weights to include rankingReward
  const trafficWeight = 0.3;
  const positionWeight = 0.3;
  const difficultyWeight = 0.2;
  const rankingWeight = 0.2; // Adjust as needed

  const overallScore =
    trafficScore * trafficWeight +
    positionScore * positionWeight +
    difficultyScore * difficultyWeight +
    rankingReward * rankingWeight;

  // Utility function for rounding
  const roundToTwo = (num: number) => parseFloat(num.toFixed(2));

  // Return rounded scores
  return {
    trafficScore: roundToTwo(trafficScore),
    difficultyScore: roundToTwo(difficultyScore),
    position,
    overall: roundToTwo(overallScore),
  };
}

export async function scoreKeyword(
  locale: LocaleCode,
  keyword: string,
  myAppId: string
): Promise<KeywordScore> {
  const searchResult = await searchApps({
    country: getCountryCode(locale),
    language: getLocaleString(locale),
    term: keyword.toLowerCase().trim(),
    num: 100,
  });

  // Ensure we have apps to analyze
  if (searchResult.apps.length === 0) {
    return {
      keyword,
      trafficScore: 0,
      difficultyScore: 0,
      position: -1,
      overall: 0,
      cacheHit: searchResult.cacheHit,
    };
  }

  const scores = calculateScores(searchResult.apps, myAppId, keyword);

  return {
    keyword,
    ...scores,
    cacheHit: searchResult.cacheHit,
  };
}
