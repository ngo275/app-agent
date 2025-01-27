import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import {
  addCompetitor,
  getTrackedCompetitors,
} from '@/lib/aso/keyword-hunt/manage-competitors';
import { LocaleCode } from '@/lib/utils/locale';

// Returns all tracked competitors for an app in a locale
export async function GET(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId, locale } = params;

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
    });

    if (!app) {
      throw new AppNotFoundError(`App ${appId} not found`);
    }

    const competitors = await getTrackedCompetitors(
      appId,
      locale as LocaleCode
    );
    // sort by review count
    competitors.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    return NextResponse.json(competitors);
  } catch (error) {
    return handleAppError(error as Error);
  }
}

// Adds a competitor to an app in a locale
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId, locale } = params;
    const data = await request.json();
    const { competitor, store = 'APPSTORE' } = data;

    if (!competitor || !store) {
      throw new InvalidParamsError('Missing required fields');
    }

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
    });

    if (!app) {
      throw new AppNotFoundError(`App ${appId} not found`);
    }

    const savedCompetitor = await addCompetitor(
      appId,
      locale as LocaleCode,
      competitor,
      store
    );

    return NextResponse.json(savedCompetitor);
  } catch (error) {
    return handleAppError(error as Error);
  }
}
