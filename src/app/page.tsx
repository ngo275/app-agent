import LandingPageView from '@/components/landing-page/view';
import LandingPageLayout from '@/components/layouts/landing-page';

export default async function LandingPage() {
  // const metadata = await fetchAppMetadata();

  return (
    <LandingPageLayout>
      <LandingPageView />
    </LandingPageLayout>
  );
}
