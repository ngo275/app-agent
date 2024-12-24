'use client';

import { AppProvider } from '@/context/app';
import { TeamProvider } from '@/context/team';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export const Providers = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) => {
  return (
    <SessionProvider session={session}>
      <TeamProvider>
        <AppProvider>
          <Toaster position="bottom-right" />
          {children}
        </AppProvider>
      </TeamProvider>
    </SessionProvider>
  );
};
