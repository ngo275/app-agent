import PlainLayout from '@/components/layouts/plain';
import { Metadata } from 'next';
import PrivacyPolicy from '@/markdown/privacy-policy.mdx';

export const metadata: Metadata = {
  title: 'Privacy Policy | AppAgent',
};

export default function PrivacyPage() {
  return (
    <PlainLayout>
      <PrivacyPolicy />
    </PlainLayout>
  );
}
