import client from '@/lib/app-store/client';
import { Country } from 'app-store-client';
import { redis } from '@/lib/redis';
import { AppStoreApp } from '@/types/app-store';
import { tarseAppData } from '@/lib/aso/tarser';

const CACHE_EXPIRATION = 60 * 60 * 24; // 1 day
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Centralized function with caching and retry logic
export async function searchApps(
  params: {
    country: Country;
    language: string;
    term: string;
    num: number;
  },
  retryCount = 0
): Promise<{ apps: Partial<AppStoreApp>[]; cacheHit: boolean }> {
  const cacheKey = `search:${params.country}:${params.language}:${params.term}:${params.num}`;

  // Check cache first
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    return { apps: cachedData as Partial<AppStoreApp>[], cacheHit: true };
  }

  // Not in cache, proceed with API call and retry logic
  try {
    const apps = (await client.search(params)) as AppStoreApp[];
    // Save to cache with an expiration time
    const tarsedApps = apps.map(tarseAppData);
    await redis.set(cacheKey, JSON.stringify(tarsedApps), {
      ex: CACHE_EXPIRATION,
    });
    return { apps: tarsedApps, cacheHit: false };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('ECONNRESET') &&
      retryCount < MAX_RETRIES
    ) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return searchApps(params, retryCount + 1);
    }
    throw error;
  }
}
