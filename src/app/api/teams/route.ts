import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { User } from '@/types/user';
import { authOptions } from '@/lib/auth';
import { handleAppError, UnauthorizedError } from '@/types/errors';

// Retrieve a list of teams that a user belongs to.
// If there is no team, it will create a new default team for the user.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new UnauthorizedError('Unauthorized');
  }

  const user = session.user as User;

  try {
    const userEntity = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userEntity) {
      throw new UnauthorizedError('Unauthorized');
    }

    const userTeams = await prisma.userTeam.findMany({
      where: { userId: user.id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            plan: true,
            startsAt: true,
            endsAt: true,
            canceledAt: true,
          },
        },
      },
      orderBy: { team: { createdAt: 'asc' } },
    });

    const teams = userTeams.map((userTeam) => userTeam.team);

    if (teams.length === 0) {
      const defaultTeamName = user.name
        ? `${user.name}'s Team`
        : 'Personal Team';
      const defaultTeam = await prisma.team.create({
        data: {
          name: defaultTeamName,
          users: {
            create: { userId: user.id, role: 'ADMIN' },
          },
        },
        select: {
          id: true,
          name: true,
          plan: true,
          startsAt: true,
          endsAt: true,
          canceledAt: true,
        },
      });
      teams.push(defaultTeam);
    }

    return NextResponse.json(teams);
  } catch (error) {
    return handleAppError(error as Error);
  }
}

// Create a new team.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new UnauthorizedError('Unauthorized');
  }

  const user = session.user as User;
  const { team } = await request.json();

  try {
    const newTeam = await prisma.team.create({
      data: {
        name: team,
        users: {
          create: { userId: user.id, role: 'ADMIN' },
        },
      },
      include: { users: true },
    });

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
