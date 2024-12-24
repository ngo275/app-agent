import { NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_POSTHOG_KEY } from '@/lib/config';

export function getPostHogConfig(): { key: string; host: string } | null {
  const postHogKey = NEXT_PUBLIC_POSTHOG_KEY;
  const postHogHost = `${NEXT_PUBLIC_BASE_URL}/ingest`;

  if (!postHogKey || !postHogHost) {
    return null;
  }

  return {
    key: postHogKey,
    host: postHogHost,
  };
}
