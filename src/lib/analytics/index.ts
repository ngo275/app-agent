import { emptyAnalytics, jitsuAnalytics } from '@jitsu/js';
import { posthog } from 'posthog-js';

import { getPostHogConfig } from '@/lib/posthog';
import { AnalyticsEvents } from '@/types/analytics';
import { JITSU_HOST, JITSU_WRITE_KEY } from '@/lib/config';

export function useAnalytics() {
  const isPostHogEnabled = getPostHogConfig();

  /**
   * Capture an analytic event.
   *
   * @param event The event name.
   * @param properties Properties to attach to the event.
   */
  const capture = (event: string, properties?: Record<string, unknown>) => {
    if (!isPostHogEnabled) {
      return;
    }

    posthog.capture(event, properties);
  };

  const identify = (
    distinctId?: string,
    properties?: Record<string, unknown>
  ) => {
    if (!isPostHogEnabled) {
      return;
    }

    posthog.identify(distinctId, properties);
  };

  return {
    capture,
    identify,
  };
}

// For server-side tracking
const analytics =
  JITSU_HOST && JITSU_WRITE_KEY
    ? jitsuAnalytics({
        host: JITSU_HOST,
        writeKey: JITSU_WRITE_KEY,
      })
    : emptyAnalytics;

export const identifyUser = (userId: string) => analytics.identify(userId);
export const trackAnalytics = (args: AnalyticsEvents) => analytics.track(args);
