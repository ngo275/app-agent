'use client';

import { useState, useMemo, useEffect } from 'react';
import LoadingOverlay from '@/components/common/loading';
import { useTeam } from '@/context/team';
import KeyUpload from '../app-store-connect/key-upload';
import AppsGrid from '../app-store-connect/apps-grid';
import { useRouter } from 'next/navigation';
import {
  useGetAppsFromAppStoreConnect,
  useGetAppsFromGooglePlay,
} from '@/lib/swr/app';
import {
  useCheckExistingKey,
  importAppsFromAppStoreConnect,
  importAppsFromGooglePlay,
} from '@/lib/swr/import';
import toast from 'react-hot-toast';
import ImportKeySkeleton from '@/components/skeleton/import-key';
import { AppErrorType } from '@/types/errors';
import { AppStoreConnectAgreementError } from '@/components/app-store-connect/app-store-agreement-error';
import { Store } from '@/types/aso';
import GooglePlayConnect from '../google-play/connect';
import GooglePlayAppsGrid from '../google-play/apps-grid';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useApp } from '@/context/app';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/lib/analytics';

export default function ImportApps() {
  const t = useTranslations('import');
  const router = useRouter();
  const analytics = useAnalytics();
  const appInfo = useApp();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingGooglePlay, setIsCheckingGooglePlay] = useState(false);
  const [googlePlayConnected, setGooglePlayConnected] = useState(false);
  const teamInfo = useTeam();
  // const [importedStores, setImportedStores] = useState<Store[]>([]);

  const {
    apps,
    loading: isLoadingApps,
    error: appsError,
    refreshApps,
  } = useGetAppsFromAppStoreConnect();
  const {
    hasKey: isKeyUploaded,
    loading: isLoadingKey,
    isRefreshing,
    refresh: refreshKey,
  } = useCheckExistingKey();
  const { apps: googlePlayApps, loading: loadingGooglePlayApps } =
    useGetAppsFromGooglePlay();

  const importedStores = useMemo(() => {
    if (!appInfo?.apps?.length) return [];
    return ['APPSTORE', 'GOOGLEPLAY'].filter((store) =>
      appInfo.apps.some((app) => app.store === store)
    );
  }, [appInfo?.apps]);

  useEffect(() => {
    if (selectedStore && appInfo?.apps) {
      const importedAppIds = appInfo.apps
        .filter((app) => app.store === selectedStore)
        .map((app) => app.id);
      setSelectedApps(importedAppIds);
    }
  }, [selectedStore, appInfo?.apps]);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      if (!teamInfo?.currentTeam?.id) {
        console.error('No team found');
        return;
      }
      if (selectedStore === 'APPSTORE') {
        await importAppsFromAppStoreConnect(
          teamInfo.currentTeam.id,
          selectedApps
        );
      } else {
        await importAppsFromGooglePlay(teamInfo.currentTeam.id, selectedApps);
      }
      await appInfo.refresh();
      toast.success(t('apps-imported-successfully'));
      analytics.capture('Apps Imported', {
        teamId: teamInfo?.currentTeam?.id,
        appIds: selectedApps,
      });

      if (importedStores.length === 1 && selectedStore) {
        const allStores = new Set([...importedStores, selectedStore]);
        if (allStores.has('APPSTORE') && allStores.has('GOOGLEPLAY')) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      toast.error(t('error-importing-apps'));
      console.error('Error importing apps:', error);
    } finally {
      setIsImporting(false);
      setSelectedApps([]);
      setSelectedStore(null);
    }
  };

  const checkGooglePlayAccess = async () => {
    setIsCheckingGooglePlay(true);
    try {
      console.log('Checking Google Play access');
      // Implement polling logic here
      // const result = await checkGooglePlayPermissions(teamInfo?.currentTeam?.id);
      // setGooglePlayConnected(result.hasAccess);
    } catch (error) {
      toast.error(t('error-checking-google-play-access'));
    } finally {
      setIsCheckingGooglePlay(false);
    }
  };

  const cardVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  if (isLoadingKey && selectedStore === 'APPSTORE') {
    return <ImportKeySkeleton />;
  }

  if (appsError?.code === AppErrorType.APP_STORE_CONNECT_AGREEMENT) {
    return <AppStoreConnectAgreementError onRefresh={refreshKey} />;
  }

  return (
    <div className="container mx-auto px-6">
      <div className="flex justify-between items-center mb-6">
        <motion.h1
          className="text-3xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t('import-apps')}
        </motion.h1>

        {importedStores.length === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              {t('start-now')}
            </Button>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
          <Card
            className={`cursor-pointer transition-colors relative ${
              selectedStore === 'APPSTORE'
                ? 'border-primary'
                : 'hover:bg-accent'
            }`}
            onClick={() =>
              setSelectedStore(selectedStore === 'APPSTORE' ? null : 'APPSTORE')
            }
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle>{t('app-store-connect')}</CardTitle>
                  <CardDescription>
                    {t('import-apps-from-app-store-connect')}
                  </CardDescription>
                </div>
                {appInfo?.apps?.length > 0 &&
                  (appInfo?.apps?.some((app) => app.store === 'APPSTORE') ||
                    importedStores.includes('APPSTORE')) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </motion.div>
                  )}
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
          <Card
            className={`cursor-pointer transition-colors relative ${
              selectedStore === 'GOOGLEPLAY'
                ? 'border-primary'
                : 'hover:bg-accent'
            }`}
            onClick={() =>
              setSelectedStore(
                selectedStore === 'GOOGLEPLAY' ? null : 'GOOGLEPLAY'
              )
            }
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle>{t('google-play-console')}</CardTitle>
                  <CardDescription>
                    {t('import-apps-from-google-play')}
                  </CardDescription>
                </div>
                {appInfo?.apps?.length > 0 &&
                  (appInfo?.apps?.some((app) => app.store === 'GOOGLEPLAY') ||
                    importedStores.includes('GOOGLEPLAY')) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </motion.div>
                  )}
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      {selectedStore && (
        <motion.div
          className="mt-6"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            className="text-2xl font-semibold mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t('setup', {
              store:
                selectedStore === 'APPSTORE'
                  ? 'App Store Connect'
                  : 'Google Play Console',
            })}
          </motion.h2>

          {selectedStore === 'APPSTORE' ? (
            isKeyUploaded ? (
              <AppsGrid
                isLoading={isLoadingApps}
                apps={apps || []}
                selectedApps={selectedApps}
                onAppSelection={(appId) =>
                  setSelectedApps((prev) =>
                    prev.includes(appId)
                      ? prev.filter((id) => id !== appId)
                      : [...prev, appId]
                  )
                }
                onImport={handleImport}
                isImporting={isImporting}
              />
            ) : (
              <KeyUpload
                onKeyUploaded={async () => {
                  await refreshKey();
                  await refreshApps();
                  analytics.capture('Key Uploaded', {
                    teamId: teamInfo?.currentTeam?.id,
                  });
                }}
                teamId={teamInfo?.currentTeam?.id}
              />
            )
          ) : (
            <>
              {!googlePlayConnected ? (
                <GooglePlayConnect
                  teamId={teamInfo?.currentTeam?.id}
                  onConnected={() => setGooglePlayConnected(true)}
                  serviceAccountEmail="sorry, we are working on this"
                />
              ) : (
                <GooglePlayAppsGrid
                  apps={googlePlayApps || []}
                  selectedApps={selectedApps}
                  onAppSelection={(appId) =>
                    setSelectedApps((prev) =>
                      prev.includes(appId)
                        ? prev.filter((id) => id !== appId)
                        : [...prev, appId]
                    )
                  }
                  onImport={handleImport}
                  isLoading={loadingGooglePlayApps}
                  isImporting={isImporting}
                />
              )}
            </>
          )}
        </motion.div>
      )}

      {isImporting && <LoadingOverlay />}
    </div>
  );
}
