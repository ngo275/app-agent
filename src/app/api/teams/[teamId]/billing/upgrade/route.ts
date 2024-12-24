import { NextResponse } from 'next/server';
import { stripeInstance } from '@/lib/payment/stripe';
import { validateTeamAccess } from '@/lib/auth';
import { NEXT_PUBLIC_BASE_URL, STRIPE_PRICE_MAPPING } from '@/lib/config';

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { userId, teamId, session, team } = await validateTeamAccess(request);

    const lineItem = {
      // Currently only support pro plan. We may want to add more plans in the future and allow users to choose.
      price: STRIPE_PRICE_MAPPING.pro.priceId,
      quantity: 1,
    };

    let checkoutSession;
    if (team.stripeId) {
      checkoutSession = await stripeInstance().checkout.sessions.create({
        customer: team.stripeId,
        customer_update: { name: 'auto' },
        // billing_address_collection: "required",
        success_url: `${NEXT_PUBLIC_BASE_URL}/dashboard/plan?success=true`,
        cancel_url: `${NEXT_PUBLIC_BASE_URL}/dashboard/plan?cancel=true`,
        line_items: [lineItem],
        automatic_tax: {
          enabled: true,
        },
        tax_id_collection: {
          enabled: true,
        },
        mode: 'subscription',
        allow_promotion_codes: true,
        client_reference_id: teamId,
      });
    } else {
      checkoutSession = await stripeInstance().checkout.sessions.create({
        customer_email: session?.user?.email ?? undefined,
        // billing_address_collection: "required",
        success_url: `${NEXT_PUBLIC_BASE_URL}/dashboard/plan?success=true`,
        cancel_url: `${NEXT_PUBLIC_BASE_URL}/dashboard/plan?cancel=true`,
        line_items: [lineItem],
        automatic_tax: {
          enabled: true,
        },
        tax_id_collection: {
          enabled: true,
        },
        mode: 'subscription',
        allow_promotion_codes: true,
        client_reference_id: teamId,
      });
    }

    console.log(`Created checkout session: ${checkoutSession.id}`);

    return NextResponse.json(checkoutSession.id);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
