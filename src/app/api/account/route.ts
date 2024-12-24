import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { User } from '@/types/user';
import { handleAppError } from '@/types/errors';

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = (session.user as User).id;
    if (!userId) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Start a transaction to handle user deletion and team cleanup
    await prisma.$transaction(async (tx) => {
      // Get all teams the user belongs to
      const userTeams = await tx.userTeam.findMany({
        where: { userId },
        select: { teamId: true },
      });

      // Delete the user
      await tx.user.delete({
        where: { id: userId },
      });

      // Check each team and delete if empty
      for (const { teamId } of userTeams) {
        const remainingMembers = await tx.userTeam.count({
          where: { teamId },
        });

        if (remainingMembers === 0) {
          await tx.team.delete({
            where: { id: teamId },
          });
        }
      }
    });

    // Clear the session
    const response = NextResponse.json({ success: true });
    response.cookies.set('next-auth.session-token', '', { maxAge: 0 });
    response.cookies.set('__Secure-next-auth.session-token', '', { maxAge: 0 });

    return response;
  } catch (error) {
    return handleAppError(error as Error);
  }
}
