'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppStoreConnectAppData } from '@/types/app-store';
import AppCardSkeleton from '@/components/skeleton/app-card';
import { useTranslations } from 'next-intl';

interface AppsGridProps {
  apps: AppStoreConnectAppData[];
  selectedApps: string[];
  isLoading: boolean;
  isImporting?: boolean;
  onAppSelection: (appId: string) => void;
  onImport?: () => void;
}

export default function AppsGrid({
  apps,
  selectedApps,
  isLoading,
  isImporting,
  onAppSelection,
  onImport,
}: AppsGridProps) {
  const t = useTranslations('dashboard.app-store-connect.localization');
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <AppCardSkeleton />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {apps.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className={`relative p-4 cursor-pointer transition-all duration-200 ${
                selectedApps.includes(app.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-300 bg-white'
              }`}
              onClick={() => onAppSelection(app.id)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {app.attributes.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {app.attributes.bundleId}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      selectedApps.includes(app.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedApps.includes(app.id) && (
                      <svg
                        className="w-full h-full text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {apps.length > 0 && (
        <motion.div
          className="flex justify-end mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Button
            onClick={onImport}
            disabled={selectedApps.length === 0 || isImporting}
            variant={
              selectedApps.length === 0 || isImporting ? 'secondary' : 'default'
            }
          >
            {isImporting ? t('importing') : t('import-selected-apps')}
          </Button>
        </motion.div>
      )}

      {apps.length === 0 && !isLoading && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-gray-500">{t('no-apps-found')}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
