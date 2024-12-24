'use client';

import { motion } from 'framer-motion';
import { HiRefresh } from 'react-icons/hi';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface VersionStatusInfoProps {
  teamId: string;
  appId: string;
  pullLatestVersion: (teamId: string, appId: string) => void;
  isRefreshing: boolean;
}

export function VersionStatusInfo({
  teamId,
  appId,
  pullLatestVersion,
  isRefreshing,
}: VersionStatusInfoProps) {
  const t = useTranslations('dashboard.app-store-connect.localization');
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mx-auto"
    >
      <div className="flex items-center justify-between space-x-8">
        <div className="flex items-center space-x-3">
          <HiRefresh className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-700">{t('version-not-up-to-date')}</p>
        </div>
        <Button
          onClick={() => pullLatestVersion(teamId, appId)}
          disabled={isRefreshing}
          variant="outline"
          className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200"
        >
          {isRefreshing ? t('pulling') : t('pull-latest-version')}
        </Button>
      </div>
    </motion.div>
  );
}
