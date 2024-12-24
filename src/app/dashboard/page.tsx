import Home from '@/components/app-store-connect/home';
import DashboardLayout from '@/components/layouts/dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | AppAgent',
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Home />
    </DashboardLayout>
  );
}
