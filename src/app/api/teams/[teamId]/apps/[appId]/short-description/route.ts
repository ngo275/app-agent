import { generateShortDescription } from '@/lib/aso/short-description';
import { validateTeamAccess } from '@/lib/auth';
import { handleAppError } from '@/types/errors';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const appId = params.appId;
    const shortDescription = await generateShortDescription(appId, teamId);
    return NextResponse.json({ shortDescription });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
