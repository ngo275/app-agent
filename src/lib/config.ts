export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';
export const VERCEL_URL = process.env.VERCEL_URL || '';
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
export const JITSU_HOST = process.env.JITSU_HOST || '';
export const JITSU_WRITE_KEY = process.env.JITSU_WRITE_KEY || '';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';
export const NEXT_PUBLIC_POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || '';
export const UPSTASH_REDIS_REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || '';
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'none';
export const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || 'none';
export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || 'none'; // May add more plans in the future
export const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'none';
export const NEXT_PUBLIC_FREE_PLAN_ENABLED =
  process.env.NEXT_PUBLIC_FREE_PLAN_ENABLED || 'none';
export const BLOCKED_PATHNAMES = [
  '/phpmyadmin',
  '/server-status',
  '/wordpress',
  '/_all_dbs',
  '/wp-json',
];

export const STRIPE_PRICE_MAPPING = {
  pro: {
    priceId: STRIPE_PRO_PRICE_ID,
    name: 'Pro',
    code: 'pro',
  },
};
