import { NextApiResponse } from 'next';

import Stripe from 'stripe';

import prisma from '@/lib/prisma';
import { STRIPE_PRICE_MAPPING } from '@/lib/config';
import sendCancelPlanEmail from '@/lib/emails/send-cancel-plan';
import { getUserLocale } from '@/lib/utils/server-locale';

export async function customerSubsciptionUpdated(event: Stripe.Event) {
  const subscriptionUpdated = event.data.object as Stripe.Subscription;
  const priceId = subscriptionUpdated.items.data[0].price.id;

  const plan = Object.values(STRIPE_PRICE_MAPPING).find(
    (p) => p.priceId === priceId
  );

  if (!plan) {
    console.error(`No plan found for price ID: ${priceId}`);
    return;
  }

  const stripeId = subscriptionUpdated.customer.toString();

  const team = await prisma.team.findUnique({
    where: { stripeId },
    include: {
      users: {
        select: {
          role: true,
          teamId: true,
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!team) {
    console.error(
      `Team with Stripe ID ${stripeId} not found in Stripe webhook customer.subscription.updated callback`
    );
    return;
  }

  const subscriptionId = subscriptionUpdated.id;
  const startsAt = new Date(subscriptionUpdated.current_period_start * 1000);
  const endsAt = new Date(subscriptionUpdated.current_period_end * 1000);
  const canceledAt = subscriptionUpdated.canceled_at
    ? new Date(subscriptionUpdated.canceled_at * 1000)
    : null;
  if (canceledAt && !team.canceledAt) {
    console.log(
      `User ${team.name} has canceled their subscription. Valid until ${endsAt}`
    );
    if (team.users[0].user.email) {
      await sendCancelPlanEmail({
        locale: await getUserLocale(),
        user: {
          email: team.users[0].user.email,
          name: team.users[0].user.name || '',
        },
      });
    }
  }
  // const quantity = subscriptionUpdated.items.data[0].quantity;

  // If a team upgrades/downgrades their subscription, update their plan
  await prisma.team.update({
    where: { stripeId },
    data: {
      plan: plan.code,
      subscriptionId,
      startsAt,
      endsAt,
      canceledAt,
    },
  });
}
