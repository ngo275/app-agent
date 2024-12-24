import { optimizeContents } from '@/lib/aso/optimize';
import { validateTeamAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { LocaleCode } from '@/lib/utils/locale';
import { draftVersion } from '@/lib/utils/versions';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import { NextResponse } from 'next/server';

export const maxDuration = 300;

// Generate ASO friendly title, subtitle, description, and keywords
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: LocaleCode } }
) {
  // It will take the final keywords, the current title, subtitle, and description as an input.
  // It will leverage LLM to generate the title, subtitle, and description.
  // It will validate the length and format of the LLM output. If it fails, it will retry with the feedback message.
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId, locale } = params;
    const data = await request.json();

    // Verify app belongs to team
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId: teamId,
      },
      include: {
        versions: {
          where: {
            state: {
              in: ['PREPARE_FOR_SUBMISSION', 'REJECTED'],
            },
          },
          take: 1,
        },
      },
    });

    if (!app) {
      throw new AppNotFoundError(`App ${appId} not found`);
    }

    const draftAppVersion = app.versions.find(
      (v) => v.state && draftVersion(v.state)
    );
    if (!draftAppVersion) {
      throw new InvalidParamsError('No draft version found for this app');
    }

    if (!data.title || !data.asoKeywords || !data.targets) {
      throw new InvalidParamsError('Missing required properties');
    }

    // Add new locale to App Store Connect
    const result = await optimizeContents(
      locale,
      data.title,
      data.asoKeywords,
      data.targets,
      data.subtitle,
      data.keywords,
      data.description,
      data.descriptionOutline,
      data.previousResult,
      data.userFeedback,
      app.store
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleAppError(error as Error);
  }
}
