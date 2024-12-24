import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTeamAccess } from '@/lib/auth';
import { AppNotFoundError, handleAppError } from '@/types/errors';

// Delete a keyword from the database
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: {
      teamId: string;
      appId: string;
      locale: string;
      keywordId: string;
    };
  }
) {
  try {
    const { teamId } = await validateTeamAccess(request);
    const { appId, keywordId } = params;

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

    // Delete the keyword
    await prisma.asoKeyword.delete({
      where: {
        id: keywordId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
