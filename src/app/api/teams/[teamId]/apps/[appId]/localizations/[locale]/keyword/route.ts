import { validateTeamAccess } from '@/lib/auth';
import { LocaleCode } from '@/lib/utils/locale';
import prisma from '@/lib/prisma';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import { NextResponse } from 'next/server';
import { scoreKeyword } from '@/lib/aso/score';

export const maxDuration = 300;

// Return all keywords for an app and locale
export async function GET(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: LocaleCode } }
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

    // Return all keywords for the app and locale
    const keywords = await prisma.asoKeyword.findMany({
      where: {
        appId: appId,
        locale: locale,
      },
      orderBy: {
        overall: 'desc',
      },
    });

    return NextResponse.json(keywords);
  } catch (error) {
    return handleAppError(error as Error);
  }
}

// Score and store a keyword in the database
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId, locale } = params;
    const data = await request.json();
    const { term } = data;
    if (!term) {
      throw new InvalidParamsError('Missing term');
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

    // Score the keyword
    const score = await scoreKeyword(locale as LocaleCode, term, appId);

    // Store the keyword score in the database
    const keyword = await prisma.asoKeyword.upsert({
      where: {
        appId_store_platform_locale_keyword: {
          appId,
          store: app.store,
          platform: app.platform,
          locale: locale as LocaleCode,
          keyword: term,
        },
      },
      update: {
        trafficScore: score.trafficScore,
        difficultyScore: score.difficultyScore,
        position: score.position,
        overall: score.overall,
      },
      create: {
        appId,
        store: app.store,
        platform: app.platform,
        locale: locale as LocaleCode,
        keyword: term,
        trafficScore: score.trafficScore,
        difficultyScore: score.difficultyScore,
        position: score.position,
        overall: score.overall,
      },
    });

    return NextResponse.json(keyword);
  } catch (error) {
    return handleAppError(error as Error);
  }
}
