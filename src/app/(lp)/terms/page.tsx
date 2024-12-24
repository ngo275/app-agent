import PlainLayout from '@/components/layouts/plain';
import { Metadata } from 'next';
import TermsOfService from '@/markdown/terms-of-service.mdx';

export const metadata: Metadata = {
  title: 'Terms of Service | AppAgent',
};

export default function TermsPage() {
  return (
    <PlainLayout>
      <TermsOfService />
    </PlainLayout>
  );
}
