import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RiBillLine } from 'react-icons/ri';
import { FaRegCreditCard } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import { useTeam } from '@/context/team';
import { STRIPE_PRICE_MAPPING } from '@/lib/config';
import { useMemo } from 'react';
import { manageBilling } from '@/lib/swr/plan';
import { useState } from 'react';
import LoadingOverlay from '../common/loading';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export function BillingSettings() {
  const teamInfo = useTeam();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('account');

  const planName = useMemo(() => {
    const plan = Object.values(STRIPE_PRICE_MAPPING).find(
      (plan) => plan.code === teamInfo?.currentTeam?.plan
    );
    return plan?.name || t('free-plan');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamInfo?.currentTeam?.plan]);

  const isCanceled = teamInfo?.currentTeam?.canceledAt !== null;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleManageBilling = async () => {
    if (!teamInfo?.currentTeam?.id) return;
    setIsLoading(true);
    try {
      const { url } = await manageBilling(teamInfo?.currentTeam?.id);
      window.open(url, '_blank');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        {isLoading && <LoadingOverlay />}
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaRegCreditCard className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{t('billing')}</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageBilling}
            className="flex items-center space-x-2"
          >
            <RiBillLine className="h-4 w-4" />
            <span>{t('manage-billing')}</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t('current-plan')}</h3>
              <p className="text-sm text-muted-foreground">{planName}</p>
            </div>
            <Badge variant={isCanceled ? 'destructive' : 'default'}>
              {isCanceled ? t('canceled') : t('active')}
            </Badge>
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="font-medium">{t('last-payment-date')}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(teamInfo?.currentTeam?.startsAt)}
              </p>
            </div>

            {isCanceled ? (
              <>
                <div>
                  <h3 className="font-medium">{t('canceled-date')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(teamInfo?.currentTeam?.canceledAt)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">{t('valid-until')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(teamInfo?.currentTeam?.endsAt)}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h3 className="font-medium">{t('next-payment-date')}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(teamInfo?.currentTeam?.endsAt)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
