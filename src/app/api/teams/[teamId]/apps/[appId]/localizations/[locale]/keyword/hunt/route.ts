import prisma from '@/lib/prisma';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppNotFoundError,
  handleAppError,
  InvalidParamsError,
} from '@/types/errors';
import { googlePlayToAppStore } from '@/lib/utils/locale';
import { draftVersion, publicVersion } from '@/lib/utils/versions';
import { Store } from '@/types/aso';
import { selectAndScoreKeywords } from '@/lib/aso/keyword-hunt/select-and-score-keywords';

export const maxDuration = 300;

// Run keyword research and make suggestion
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string; locale: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId, locale } = params;
    const data = await request.json();

    if (!data.shortDescription || !data.store || !data.platform) {
      throw new InvalidParamsError('Missing required fields');
    }

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

          // Convert Google Play locale to App Store locale for keyword research
          const appStoreLocale = googlePlayToAppStore(locale);

          const result = await selectAndScoreKeywords(
            appId,
            appStoreLocale,
            data.shortDescription,
            data.store,
            data.platform,
            writer,
            locale // Pass original locale for DB lookup
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
