'use client';

import { getSession } from 'next-auth/react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

import { getPostHogConfig } from '@/lib/posthog';
import { User } from '@/types/user';

export const PostHogCustomProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const posthogConfig = getPostHogConfig();

  // Check that PostHog is client-side
  if (typeof window !== 'undefined' && posthogConfig) {
    posthog.init(posthogConfig.key, {
      api_host: posthogConfig.host,
      // ui_host: "https://us.posthog.com",
      disable_session_recording: true,
      // Enable debug mode in development
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug();
        getSession()
          .then((session) => {
            if (session) {
              posthog.identify(
                (session.user as User).email ?? (session.user as User).id
              );
            } else {
              posthog.reset();
            }
          })
          .catch(() => {
            // Do nothing.
          });
      },
    });
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};
