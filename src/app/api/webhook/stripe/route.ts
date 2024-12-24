import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripeInstance } from '@/lib/payment/stripe';
import { checkoutSessionCompleted } from '@/lib/payment/stripe/webhook/checkout-session-completed';
import { customerSubscriptionDeleted } from '@/lib/payment/stripe/webhook/customer-subscription-deleted';
import { customerSubsciptionUpdated } from '@/lib/payment/stripe/webhook/customer-subscription-updated';
import { STRIPE_WEBHOOK_SECRET } from '@/lib/config';

// Stripe requires the raw body to construct the event
// This config is no longer needed in Next.js App Router
// The App Router automatically handles raw body access for webhooks

async function buffer(readable: ReadableStream) {
  const chunks = [];
  const reader = readable.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature');
  const webhookSecret = STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      return new NextResponse('Webhook signature or secret missing', {
        status: 400,
      });
    }

    const stripe = stripeInstance();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    console.log(`Ignored event type: ${event.type}`);
    return new NextResponse(`Ignored event type: ${event.type}`, {
      status: 200,
    });
  }

  try {
    console.log(`Processing event type: ${event.type}`);
    switch (event.type) {
      case 'checkout.session.completed':
        await checkoutSessionCompleted(event);
        break;
      case 'customer.subscription.updated':
        await customerSubsciptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await customerSubscriptionDeleted(event);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Webhook handler failed', { status: 400 });
  }
}
