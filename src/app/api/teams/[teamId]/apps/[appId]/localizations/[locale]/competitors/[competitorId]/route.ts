import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import { removeCompetitor } from '@/lib/aso/keyword-hunt/manage-competitors';
import { LocaleCode } from '@/lib/utils/locale';

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: {
      teamId: string;
      appId: string;
      locale: string;
      competitorId: string;
    };
  }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId, locale, competitorId } = params;

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

    if (!competitorId) {
      throw new InvalidParamsError('Missing competitorId');
    }

    const success = await removeCompetitor(
      appId,
      locale as LocaleCode,
      competitorId
    );

    if (!success) {
      throw new Error('Failed to remove competitor');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
