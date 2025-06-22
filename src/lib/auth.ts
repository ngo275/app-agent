import { PrismaAdapter } from '@next-auth/prisma-adapter';
// import { PasskeyProvider } from "@teamhanko/passkeys-next-auth-provider";
import NextAuth, {
  getServerSession,
  Session,
  type NextAuthOptions,
} from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';

import { identifyUser, trackAnalytics } from '@/lib/analytics';
import sendVerificationRequestEmail from '@/lib/emails/send-verification-request';
import sendWelcomeEmail from '@/lib/emails/send-welcome';
// import hanko from "@/lib/hanko";
import { CreateUserEmailProps, Team, User } from '@/types/user';
import prisma from '@/lib/prisma';
import { AnalyticsEvent } from '@/types/analytics';
import { generateJWT } from '@/lib/app-store-connect/auth';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  VERCEL_URL,
  WHITE_LABEL_CONFIG,
} from '@/lib/config';
import { NotPermittedError, UnauthorizedError } from '@/types/errors';
import { getUserLocale } from '@/lib/utils/server-locale';

const VERCEL_DEPLOYMENT = !!VERCEL_URL;

export const authOptions: NextAuthOptions = {
  pages: {
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID as string,
      clientSecret: GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    // LinkedInProvider({
    //   clientId: process.env.LINKEDIN_CLIENT_ID as string,
    //   clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
    //   authorization: {
    //     params: { scope: "openid profile email" },
    //   },
    //   issuer: "https://www.linkedin.com/oauth",
    //   jwks_endpoint: "https://www.linkedin.com/oauth/openid/jwks",
    //   profile(profile, tokens) {
    //     const defaultImage =
    //       "https://cdn-icons-png.flaticon.com/512/174/174857.png";
    //     return {
    //       id: profile.sub,
    //       name: profile.name,
    //       email: profile.email,
    //       image: profile.picture ?? defaultImage,
    //     };
    //   },
    //   allowDangerousEmailAccountLinking: true,
    // }),
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Login URL]', url);
          return;
        } else {
          console.log(
            `Sending verification request email to ${identifier} with url ${url}`
          );
          await sendVerificationRequestEmail({
            locale: await getUserLocale(),
            url,
            email: identifier,
          });
        }
      },
    }),
    // PasskeyProvider({
    //   tenant: hanko,
    //   async authorize({ userId }) {
    //     const user = await prisma.user.findUnique({ where: { id: userId } });
    //     if (!user) return null;
    //     return user;
    //   },
    // }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: `${VERCEL_DEPLOYMENT ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
        domain: VERCEL_DEPLOYMENT ? `.${WHITE_LABEL_CONFIG.domain}` : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (!token.email) {
        return {};
      }
      if (user) {
        token.user = user;
      }
      return token;
    },
    session: async ({ session, token }) => {
      (session.user as User) = {
        id: token.sub,
        // @ts-ignore
        ...(token || session).user,
      };
      return session;
    },
  },
  events: {
    async createUser(message) {
      const locale = await getUserLocale();

      // Update user with locale
      await prisma.user.update({
        where: { id: message.user.id },
        data: { locale },
      });

      const params: CreateUserEmailProps = {
        locale,
        user: {
          name: message.user.name,
          email: message.user.email,
        },
      };

      await identifyUser(message.user.email ?? message.user.id);
      await trackAnalytics({
        event: AnalyticsEvent.UserSignedUp,
        email: message.user.email,
        userId: message.user.id,
      });

      sendWelcomeEmail(params).catch((error) => {
        console.error(error);
      });

      // return { redirect: { destination: '/welcome' } };
    },
    async signIn(message) {
      await identifyUser(message.user.email ?? message.user.id);
      await trackAnalytics({
        event: AnalyticsEvent.UserSignedIn,
        email: message.user.email,
      });
    },
  },
};

export async function validateTeamAccess(req: Request): Promise<{
  userId: string;
  teamId: string;
  session: Session;
  team: Team;
  appStoreConnectJWT: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log('Unauthorized - no session');
    throw new UnauthorizedError('No session');
  }

  const userId = (session.user as User).id;
  const teamId = req.url.split('/teams/')[1]?.split('/')[0];

  if (!teamId || !userId) {
    console.log('Unauthorized - no teamId or userId');
    throw new NotPermittedError('No teamId or userId');
  }

  // TODO: fix this
  // @ts-ignore
  const team: Team | null = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      appStoreConnectPrivateKey: true,
      appStoreConnectKeyId: true,
      appStoreConnectIssuerId: true,
      appStoreConnectJWT: true,
      appStoreConnectJWTExpiresAt: true,
      stripeId: true,
      startsAt: true,
      endsAt: true,
      canceledAt: true,
      users: {
        select: {
          role: true,
          teamId: true,
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!team) {
    console.log('Unauthorized - team not found');
    throw new NotPermittedError('Team not found');
  }

  // Check if the user is a member of the team
  const teamUsers = team.users;
  const isUserPartOfTeam = teamUsers?.some((user) => user.userId === userId);
  if (!isUserPartOfTeam) {
    console.log('Unauthorized - user not part of team');
    throw new NotPermittedError('User not part of team');
  }

  let appStoreConnectJWT = team.appStoreConnectJWT;
  const currentTime = new Date();

  // Check if the JWT exists and is not expired
  if (
    team.appStoreConnectJWT &&
    team.appStoreConnectJWTExpiresAt &&
    team.appStoreConnectJWTExpiresAt > currentTime
  ) {
    appStoreConnectJWT = team.appStoreConnectJWT;
  } else {
    if (
      !team.appStoreConnectKeyId ||
      !team.appStoreConnectIssuerId ||
      !team.appStoreConnectPrivateKey
    ) {
      return {
        userId,
        teamId,
        session,
        team,
        appStoreConnectJWT: '',
      };
    }

    console.log('Generating new JWT');
    // Generate new JWT
    appStoreConnectJWT = await generateJWT(
      team.appStoreConnectIssuerId,
      team.appStoreConnectKeyId,
      team.appStoreConnectPrivateKey
    );

    // Update team with new JWT and expiration time
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 20);

    await prisma.team.update({
      where: { id: team.id },
      data: {
        appStoreConnectJWT: appStoreConnectJWT,
        appStoreConnectJWTExpiresAt: expirationTime,
      },
    });
    console.log(`Updated team ${team.id} with new JWT`);
  }

  return { userId, teamId, session, team, appStoreConnectJWT };
}

export function isAppStoreConnectJWTExpired(token: string): boolean {
  // TODO: implement JWT expiration check
  return false;
}

export async function refreshAppStoreConnectJWT(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    throw new Error('Team not found');
  }
  if (
    !team.appStoreConnectKeyId ||
    !team.appStoreConnectIssuerId ||
    !team.appStoreConnectPrivateKey
  ) {
    throw new Error('Team does not have App Store Connect credentials');
  }

  const jwt = await generateJWT(
    team.appStoreConnectKeyId,
    team.appStoreConnectIssuerId,
    team.appStoreConnectPrivateKey
  );

  return jwt;
}
