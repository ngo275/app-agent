import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import { LocaleCode } from '@/lib/utils/locale';
import { searchApps } from '@/lib/app-store/search-apps';
import { findCompetitors } from '@/lib/aso/keyword-hunt/find-competitors';
import { draftVersion } from '@/lib/utils/versions';

export const maxDuration = 300;

// Run competitor research and return a list of competitor apps
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
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
              in: ['PREPARE_FOR_SUBMISSION', 'REJECTED', 'DEVELOPER_REJECTED'],
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

          const result = await findCompetitors(
            appId,
            locale as LocaleCode,
            data.shortDescription,
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
