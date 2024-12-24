'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface GooglePlayConnectProps {
  teamId?: string;
  onConnected: () => void;
  serviceAccountEmail: string;
}

export default function GooglePlayConnect({
  teamId,
  onConnected,
  serviceAccountEmail,
}: GooglePlayConnectProps) {
  const [isChecking, setIsChecking] = useState(false);
  const t = useTranslations('import');

  const checkAccess = async () => {
    setIsChecking(true);
    try {
      // Start polling for access verification
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(
            `/api/google-play/verify-access?teamId=${teamId}`
          );
          const data = await response.json();

          if (data.hasAccess) {
            clearInterval(pollInterval);
            onConnected();
            toast.success(t('successfully-connected-to-google-play-console'));
          }
        } catch (error) {
          console.error('Error checking access:', error);
        }
      }, 5000); // Poll every 5 seconds

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsChecking(false);
        toast.error(t('connection-timeout'));
      }, 120000);
    } catch (error) {
      toast.error(t('error-checking-google-play-access'));
      setIsChecking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-semibold"
          >
            {t('connect-to-google-play-console')}
          </motion.h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="mb-2 font-medium">{t('step-one')}</p>
            <p className="text-sm text-muted-foreground">
              {t('step-one-description')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="mb-2 font-medium">{t('step-two')}</p>
            <div className="w-full p-3 text-sm bg-muted rounded">
              {t('step-two-description', { email: serviceAccountEmail })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="mb-2 font-medium">{t('step-three')}</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 space-y-1">
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {t('step-three-report-permissions')}
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                {t('step-three-financial-data-permissions')}
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                {t('step-three-reply-to-reviews-permissions')}
              </motion.li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              disabled={true}
              onClick={checkAccess}
              // disabled={isChecking}
              className="w-full"
              variant="default"
            >
              {isChecking ? t('checking-access') : t('verify-access')}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
