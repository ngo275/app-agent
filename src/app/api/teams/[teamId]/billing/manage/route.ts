import { validateTeamAccess } from '@/lib/auth';
import { NEXT_PUBLIC_BASE_URL } from '@/lib/config';
import { stripeInstance } from '@/lib/payment/stripe';
import { handleAppError, UnauthorizedError } from '@/types/errors';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId, team } = await validateTeamAccess(request);
    if (!team.stripeId) {
      throw new UnauthorizedError('Team does not have a Stripe ID');
    }

    const data = await stripeInstance().billingPortal.sessions.create({
      customer: team.stripeId,
      return_url: `${NEXT_PUBLIC_BASE_URL}/dashboard/account`,
    });

    return NextResponse.json({ url: data.url });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
