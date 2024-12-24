import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { stripeInstance } from '@/lib/payment/stripe';
import { STRIPE_PRICE_MAPPING } from '@/lib/config';
import { NoPlanFoundError } from '@/types/errors';
import sendUpgradePlanEmail from '@/lib/emails/send-upgrade-plan';
import { getUserLocale } from '@/lib/utils/server-locale';

export async function checkoutSessionCompleted(event: Stripe.Event) {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  if (
    checkoutSession.client_reference_id === null ||
    checkoutSession.customer === null
  ) {
    console.error('Missing items in Stripe webhook callback');
    return;
  }

  const stripe = stripeInstance();
  const subscription = await stripe.subscriptions.retrieve(
    checkoutSession.subscription as string
  );
  const priceId = subscription.items.data[0].price.id;
  const subscriptionId = subscription.id;
  const subscriptionStart = new Date(subscription.current_period_start * 1000);
  const subscriptionEnd = new Date(subscription.current_period_end * 1000);
  // const quantity = subscription.items.data[0].quantity;

  console.log('subscription', subscription);
  console.log('subscription items', subscription.items.data);

  const plan = Object.values(STRIPE_PRICE_MAPPING).find(
    (p) => p.priceId === priceId
  );
  if (!plan) {
    throw new NoPlanFoundError(`No plan found for price ID: ${priceId}`);
  }

  const stripeId = checkoutSession.customer.toString();
  const teamId = checkoutSession.client_reference_id;

  // Update the user with the subscription information and stripeId
  const team = await prisma.team.update({
    where: {
      id: teamId,
    },
    data: {
      stripeId,
      plan: plan.code,
      subscriptionId,
      startsAt: subscriptionStart,
      endsAt: subscriptionEnd,
      // limits: planLimits,
    },
    select: {
      id: true,
      users: {
        where: { role: 'ADMIN' },
        select: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  // Send thank you email to project owner if they are a new customer
  await sendUpgradePlanEmail({
    locale: await getUserLocale(),
    user: {
      email: team.users[0].user.email as string,
      name: team.users[0].user.name as string,
    },
    planType: plan.name,
  });
}
