'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/lib/swr/plan';
import { useTeam } from '@/context/team';
import { getStripe } from '@/lib/payment/stripe/client';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import LoadingOverlay from '../common/loading';
import { useRouter, useSearchParams } from 'next/navigation';
import Confetti from 'react-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';

export default function UpgradePlan() {
  const teamInfo = useTeam();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('plan');

  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      setShowSuccess(true);
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push('/dashboard/import');
      }, 3000);
    }

    if (searchParams?.get('cancel') === 'true') {
      toast.error(t('payment-canceled'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleUpgrade = async () => {
    if (!teamInfo?.currentTeam?.id) {
      return;
    }

    if (teamInfo?.currentTeam?.plan === 'pro') {
      toast.error(t('already-subscribed'));
      router.push('/dashboard/import');
      return;
    }

    setIsLoading(true);

    try {
      const sessionId = await createCheckoutSession(
        teamInfo?.currentTeam?.id || ''
      );
      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error(error);
      toast.error(t('failed-to-create-checkout-session'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showSuccess && <Confetti />}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('thank-you-for-your-subscription')}</DialogTitle>
          </DialogHeader>
          <p className="text-center text-gray-600">
            {t('your-payment-was-successful')}
          </p>
          <Button
            className="w-full"
            onClick={() => router.push('/dashboard/import')}
          >
            {t('connect-store')}
          </Button>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="text-center mt-6 2xl:mt-12 space-y-4"
      >
        {isLoading && <LoadingOverlay />}
        <Button
          size="lg"
          className="px-8 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleUpgrade}
        >
          {t('proceed-to-payment')}
        </Button>
        <p className="text-gray-700 text-lg max-w-2xl mx-auto">
          {t('support-appagent-open-source-journey')}
          <br />
          {t('support-appagent-open-source-journey-two')}
        </p>
      </motion.div>
    </>
  );
}
