import { Suspense } from 'react';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '@/lib/config';
import Login from '@/components/auth/login';
import PlainLayout from '@/components/layouts/plain';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | AppAgent',
};

export default function LoginPage() {
  return (
    <PlainLayout>
      <Suspense fallback={<p>Loading sign-in…</p>}>
        <Login
          googleEnabled={Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)}
          terminalLogin={process.env.NODE_ENV === 'development'}
        />
      </Suspense>
    </PlainLayout>
  );
}
