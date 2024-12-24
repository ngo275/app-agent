import { NextResponse } from 'next/server';
import { scoreKeyword } from '@/lib/aso/score';
import prisma from '@/lib/prisma';
import { LocaleCode } from '@/lib/utils/locale';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';

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
