import Stripe from 'stripe';
import prisma from '@/lib/prisma';

export async function customerSubscriptionDeleted(event: Stripe.Event) {
  const subscriptionDeleted = event.data.object as Stripe.Subscription;

  const stripeId = subscriptionDeleted.customer.toString();
  const subscriptionId = subscriptionDeleted.id;

  try {
    // If a team cancels their subscription, reset their plan to free
    const team = await prisma.team.update({
      where: {
        stripeId,
        subscriptionId,
      },
      data: {
        plan: 'free',
        subscriptionId: null,
        endsAt: null,
        startsAt: null,
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

    console.log(`Team ${team.id} deleted their subscription`);
  } catch (error) {
    console.error(
      `Failed to update team with Stripe ID ${stripeId} and Subscription ID ${subscriptionId} in Stripe webhook customer.subscription.deleted callback`
    );
    return;
  }
}
