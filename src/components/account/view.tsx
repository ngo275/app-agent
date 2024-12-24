'use client';

import { AccountInfo } from '@/components/account/account-info';
import { TeamSettings } from '@/components/account/team-settings';
import { BillingSettings } from '@/components/account/bill-settings';
import { motion } from 'framer-motion';
import { DeleteAccount } from '@/components/account/delete-account';
import { useTranslations } from 'next-intl';

export default function AccountSettingsView() {
  const t = useTranslations('account');
  return (
    <div className="container max-w-2xl py-2 space-y-8 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold">{t('account-settings')}</h1>
        <p className="text-muted-foreground">
          {t('account-settings-description')}
        </p>
      </motion.div>

      <div className="space-y-6">
        <AccountInfo />
        <TeamSettings />
        <BillingSettings />
        <DeleteAccount />
      </div>
    </div>
  );
}
