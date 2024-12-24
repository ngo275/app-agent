import { STRIPE_SECRET_KEY } from '@/lib/config';
import Stripe from 'stripe';

const stripeNew = new Stripe(STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
  appInfo: {
    name: 'AppAgent',
    version: '0.1.0',
  },
  typescript: true,
});

export const stripeInstance = () => {
  return stripeNew;
};

export async function cancelSubscription(customer?: string) {
  if (!customer) return;

  try {
    const stripe = stripeInstance();
    const subscriptionId = await stripe.subscriptions
      .list({
        customer,
      })
      .then((res) => res.data[0].id);

    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: 'Customer deleted their AppAgent instance.',
      },
    });
  } catch (error) {
    return;
  }
}
