import { Stripe as StripeProps, loadStripe } from '@stripe/stripe-js';
import { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } from '@/lib/config';

let stripePromise: Promise<StripeProps | null>;

/**
 * Get the Stripe client for the frontend.
 * @returns
 */
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '', {
      apiVersion: '2024-11-20.acacia',
    });
  }

  return stripePromise;
};
