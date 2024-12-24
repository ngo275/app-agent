import { NextRequest, NextResponse } from 'next/server';

import { authOptions, validateTeamAccess } from '@/lib/auth';
import { Team, User } from '@/types/user';
import {
  handleAppError,
  NotPermittedError,
  UnauthorizedError,
} from '@/types/errors';

// Retrieve the detail of a team.
export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { userId, teamId, session, team } = await validateTeamAccess(request);
    return NextResponse.json(team);
  } catch (error) {
    return handleAppError(error as Error);
  }
}

// Delete a specified team.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { userId, teamId, session, team } = await validateTeamAccess(request);

    // check if current user is admin of the team
    const isUserAdmin = team.users.some(
      (user) =>
        user.role === 'ADMIN' && user.userId === (session.user as User).id
    );
    if (!isUserAdmin) {
      throw new NotPermittedError(
        'You are not permitted to perform this action'
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
