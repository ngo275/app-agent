import Login from '@/components/auth/login';
import PlainLayout from '@/components/layouts/plain';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | AppAgent',
};

export default function LoginPage() {
  return (
    <PlainLayout>
      <Login />
    </PlainLayout>
  );
}
