import { User as PrismaUser, Team as PrismaTeam } from '@prisma/client';
import { User as NextAuthUser } from 'next-auth';
import { App } from './aso';

export type User = PrismaUser & NextAuthUser;

export interface CreateUserEmailProps {
  locale: string;
  user: {
    name: string | null | undefined;
    email: string | null | undefined;
  };
}

export interface Team extends PrismaTeam {
  id: string;
  name: string;
  appStoreConnectPrivateKey: string | null;
  appStoreConnectKeyId: string | null;
  appStoreConnectIssuerId: string | null;
  plan: string;
  // TODO: add googlePlayCredentials
  users: {
    role: 'ADMIN' | 'MANAGER' | 'MEMBER';
    teamId: string;
    user: {
      email: string;
      name: string;
    };
    userId: string;
  }[];
}

export interface TeamDetail {
  id: string;
  name: string;
  apps: App[];
  users: {
    role: 'ADMIN' | 'MANAGER' | 'MEMBER';
    teamId: string;
    user: {
      email: string;
      name: string;
    };
    userId: string;
  }[];
}
