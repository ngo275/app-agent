import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import {
  UnauthorizedError,
  NotPermittedError,
  handleAppError,
} from '@/types/errors';
import prisma from '@/lib/prisma';
import { App } from '@/types/aso';

export const maxDuration = 20;

// Retrieve the app list from the database.
// The latest data of App Store Connect must be imported by the `import` endpoint.
export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = await validateTeamAccess(request);

    const apps: App[] = await prisma.app.findMany({
      where: {
        teamId: teamId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(apps);
  } catch (error) {
    return handleAppError(error as Error);
  }
}
