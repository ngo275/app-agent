import LandingPageView from '@/components/landing-page/view';
import LandingPageLayout from '@/components/layouts/landing-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AppAgent | ASO、そしてリリースまでを効率化',
  description:
    'AppAgentは、専門知識なしで、アプリストア最適化（ASO）を自動化し、多言語のリリースノートの自動化等、リリースまでの工程を効率化します。App Radar、AppTweak、Sensor Towerなどの既存のASOツールは高価で煩雑なままですが、AppAgentは、AIを駆使しゼロからユーザ体験を再設計しました。',
  alternates: {
    canonical: '/ja',
    languages: {
      en: '/',
      ja: '/ja',
    },
  },
  openGraph: {
    title: 'AppAgent | ASO、そしてリリースまでを効率化',
    description:
      'AppAgentは、専門知識なしで、アプリストア最適化（ASO）を自動化し、多言語のリリースノートの自動化等、リリースまでの工程を効率化します。App Radar、AppTweak、Sensor Towerなどの既存のASOツールは高価で煩雑なままですが、AppAgentは、AIを駆使しゼロからユーザ体験を再設計しました。',
    url: 'https://app-agent.ai/ja',
    siteName: 'AppAgent',
    images: [
      {
        url: 'https://app-agent.ai/images/og.jpg',
        width: 1200,
        height: 630,
        alt: 'AppAgent',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AppAgent | ASO、そしてリリースまでを効率化',
    description:
      'AppAgentは、専門知識なしで、アプリストア最適化（ASO）を自動化し、多言語のリリースノートの自動化等、リリースまでの工程を効率化します。App Radar、AppTweak、Sensor Towerなどの既存のASOツールは高価で煩雑なままですが、AppAgentは、AIを駆使しゼロからユーザ体験を再設計しました。',
    images: ['https://app-agent.ai/images/og.jpg'],
    site: '@ngo275',
  },
};

// FIXME: This is a temporary page to test the landing page in Japanese.
// It should be moved to [locale] to be more robust.
export default async function LocalizedLandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <LandingPageLayout>
      <LandingPageView />
    </LandingPageLayout>
  );
}
