import { NextResponse } from 'next/server';
import { validateTeamAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UnauthorizedError, handleAppError } from '@/types/errors';

export async function GET(request: Request) {
  try {
    const { teamId } = await validateTeamAccess(request);

    const apps = await prisma.app.findMany({
      where: {
        teamId,
      },
      select: {
        id: true,
        store: true,
        platform: true,
        storeAppId: true,
        title: true,
        primaryLocale: true,
      },
    });

    return NextResponse.json({ apps });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
