import scraperClient from '@/lib/google-play/scraper-client';
import { redis } from '@/lib/redis';
import { GooglePlaySearchResult } from '@/types/google-play';

const CACHE_EXPIRATION = 60 * 60 * 24; // 1 day
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface SearchParams {
  term: string;
  num?: number;
  lang?: string;
  country?: string;
  fullDetail?: boolean;
  price?: 'all' | 'free' | 'paid';
}

/**
 * Search for apps on Google Play Store with caching and retry logic
 * @param params Search parameters
 * @param retryCount Current retry attempt
 * @returns Search results with cache hit status
 */
export async function searchApps(
  params: SearchParams,
  retryCount = 0
): Promise<{ apps: GooglePlaySearchResult[]; cacheHit: boolean }> {
  const {
    term,
    num = 20,
    lang = 'en',
    country = 'us',
    fullDetail = false,
    price = 'all',
  } = params;

  const cacheKey = `gplay-search:${country}:${lang}:${term}:${num}:${price}`;

  // Check cache first
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return {
        apps: cachedData as GooglePlaySearchResult[],
        cacheHit: true,
      };
    }
  } catch (error) {
    console.error('Redis cache read error:', error);
  }

  // Not in cache, proceed with API call and retry logic
  try {
    const apps = await scraperClient.search({
      term,
      num,
      lang,
      country,
      fullDetail,
      price,
    });

    // Transform results to match our type
    const transformedApps: GooglePlaySearchResult[] = apps.map((app: any) => ({
      appId: app.appId,
      title: app.title,
      summary: app.summary,
      developer: app.developer,
      developerId: app.developerId,
      icon: app.icon,
      score: app.score,
      scoreText: app.scoreText,
      priceText: app.priceText,
      free: app.free,
      url: app.url,
    }));

    // Save to cache with an expiration time
    try {
      await redis.set(cacheKey, JSON.stringify(transformedApps), {
        ex: CACHE_EXPIRATION,
      });
    } catch (error) {
      console.error('Redis cache write error:', error);
    }

    return { apps: transformedApps, cacheHit: false };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT')) &&
      retryCount < MAX_RETRIES
    ) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return searchApps(params, retryCount + 1);
    }
    throw error;
  }
}
