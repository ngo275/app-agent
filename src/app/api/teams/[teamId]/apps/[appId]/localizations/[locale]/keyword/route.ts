import { validateTeamAccess } from '@/lib/auth';
import { LocaleCode } from '@/lib/utils/locale';
import prisma from '@/lib/prisma';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import { suggestKeywords } from '@/lib/aso/suggest';
import { NextResponse } from 'next/server';
import { draftVersion } from '@/lib/utils/versions';

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

// Run keyword research and make suggestion
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: LocaleCode } }
) {
  // It will retrieve the App Store data and compute the basic stats (diffuculty, competitors' keywords based on locale)
  // It will leverage LLM to rerank the keyword candidates
  try {
    const { appStoreConnectJWT, teamId } = await validateTeamAccess(request);
    const { appId, locale } = params;
    const data = await request.json();

    if (!data.shortDescription) {
      throw new InvalidParamsError('Short description is required');
    }
    if (!data.store) {
      throw new InvalidParamsError('Store is required');
    }
    if (!data.platform) {
      throw new InvalidParamsError('Platform is required');
    }

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

    // Save shortDescription to database
    await prisma.app.update({
      where: {
        id: appId,
      },
      data: {
        shortDescription: data.shortDescription,
      },
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const writer = {
            write: (data: any) => {
              controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
            },
          };

          const result = await suggestKeywords(
            appId,
            locale,
            data.shortDescription,
            data.store,
            data.platform,
            writer
          );
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
