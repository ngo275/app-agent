import { optimizeContents } from '@/lib/aso/optimize';
import { validateTeamAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { LocaleCode } from '@/lib/utils/locale';
import { draftVersion, publicVersion } from '@/lib/utils/versions';
import { Store } from '@/types/aso';
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
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Get more versions to find either draft or public
        },
      },
    });

    if (!app) {
      throw new AppNotFoundError(`App ${appId} not found`);
    }

    // For Google Play, we can use public versions
    // For App Store, we prefer draft versions
    let appVersion = app.versions.find((v) => v.state && draftVersion(v.state));

    if (!appVersion && app.store === Store.GOOGLEPLAY) {
      // If no draft, use public version for Google Play
      appVersion = app.versions.find((v) => v.state && publicVersion(v.state));
    }

    if (!appVersion) {
      throw new InvalidParamsError(
        app.store === Store.GOOGLEPLAY
          ? 'No version found for this app'
          : 'No draft version found for this app'
      );
    }

    if (!data.title || !data.asoKeywords || !data.targets) {
      throw new InvalidParamsError('Missing required properties');
    }

    // Generate optimized ASO content
    const result = await optimizeContents(
      locale,
      data.title,
      data.asoKeywords,
      data.targets,
      data.subtitle,
      data.keywords,
      data.description,
      data.shortDescription,
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
