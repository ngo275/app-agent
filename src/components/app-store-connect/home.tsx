'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  MdUpload,
  MdDownload,
  MdSave,
  MdOutlineRocketLaunch,
} from 'react-icons/md';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip } from 'react-tooltip';

import { useApp } from '@/context/app';
import { useTeam } from '@/context/team';
import { checkShortDescription, useGetAppLocalizations } from '@/lib/swr/app';
import {
  createNewVersion,
  pullLatestVersion,
  pushVersion,
  stageVersion,
  useVersionCheck,
} from '@/lib/swr/version';
import AppLocalizations from '@/components/app-store-connect/app-localizations';
import { VersionStatusInfo } from '@/components/app-store-connect/version-status-info';
import LoadingOverlay from '@/components/common/loading';
import HomeSkeleton from '@/components/skeleton/home';
import { VersionLabel } from './version-label';
import { CreateNewVersion } from './create-new-version';
import { publicVersion } from '@/lib/utils/versions';
import { NoLocalizations } from '@/components/app-store-connect/no-localizations';
import { AppLocalization } from '@/types/aso';
import { AppStoreConnectVersionConflictError } from '@/types/errors';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NEXT_PUBLIC_FREE_PLAN_ENABLED } from '@/lib/config';
import SubmitDialog from './submission/submit-dialog';
import { AppStoreState } from '@/types/app-store';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('dashboard.app-store-connect.localization');
  const router = useRouter();
  const {
    currentApp,
    apps,
    isLoading: appsLoading,
    refresh: refreshApp,
  } = useApp();
  const teamInfo = useTeam();
  const {
    versionStatus,
    loading: versionStatusLoading,
    error: versionStatusError,
    isRefreshing: versionStatusIsRefreshing,
    refresh: versionStatusRefresh,
  } = useVersionCheck(currentApp?.id || '');
  const { localizations, loading, error, isRefreshing, refresh } =
    useGetAppLocalizations(currentApp?.id || '');
  const [isStaged, setIsStaged] = useState(currentApp?.isStaged || false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPullDialog, setShowPullDialog] = useState(false);
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [workingLocalizations, setWorkingLocalizations] = useState<{
    [key: string]: { public?: AppLocalization; draft?: AppLocalization };
  }>(localizations || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [pullUsed, setPullUsed] = useState(false);

  useEffect(() => {
    setIsStaged(currentApp?.isStaged || false);
    setHasChanges(false);
    setPullUsed(false);

    (async () => {
      if (currentApp?.id && !currentApp?.shortDescription) {
        await checkShortDescription(
          teamInfo?.currentTeam?.id || '',
          currentApp.id
        );
        await refreshApp();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentApp?.id, currentApp?.isStaged, currentApp?.shortDescription]);

  useEffect(() => {
    if (NEXT_PUBLIC_FREE_PLAN_ENABLED !== 'true') {
      // If the team is free, redirect to the plan page
      if (
        teamInfo?.currentTeam &&
        (teamInfo?.currentTeam?.plan === null ||
          teamInfo?.currentTeam?.plan === 'free')
      ) {
        router.push('/dashboard/plan');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamInfo?.currentTeam?.plan]);

  useEffect(() => {
    if (currentApp?.shortDescription) {
      setWorkingLocalizations(localizations || {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentApp?.shortDescription]);

  useEffect(() => {
    // if (Object.keys(workingLocalizations).length) return;
    setWorkingLocalizations(localizations || {});
  }, [localizations]);

  const canSubmit = useMemo(() => {
    return (
      versionStatus?.upToDate &&
      [
        AppStoreState.PREPARE_FOR_SUBMISSION,
        AppStoreState.READY_FOR_REVIEW,
      ].includes(versionStatus?.localVersion.state as AppStoreState) &&
      localizations &&
      Object.keys(localizations).length > 0 &&
      Object.values(localizations).every((loc) => loc.draft?.whatsNew)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionStatus?.upToDate, localizations]);

  const needCreateNewVersion = useMemo(() => {
    return (
      versionStatus?.upToDate &&
      publicVersion(versionStatus?.localVersion.state || '')
    );
  }, [versionStatus?.upToDate, versionStatus?.localVersion.state]);

  const handleUpdateLocalizations = (
    locale: string,
    updatedData: Partial<AppLocalization>
  ) => {
    setWorkingLocalizations((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        draft: {
          ...((prev[locale]?.draft || {}) as AppLocalization),
          ...updatedData,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const drafts = Object.values(workingLocalizations)
        .map((loc) => loc.draft)
        .filter((draft): draft is AppLocalization => !!draft);

      await stageVersion(
        teamInfo?.currentTeam?.id || '',
        currentApp?.id || '',
        drafts
      );
      setIsStaged(true);
      setHasChanges(false);
      toast.success(t('changes-saved-successfully'));
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error(t('failed-to-save-changes'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePull = async () => {
    setShowPullDialog(false);
    setIsPulling(true);
    try {
      await pullLatestVersion(
        teamInfo?.currentTeam?.id || '',
        currentApp?.id || ''
      );
      await versionStatusRefresh();
      await refresh();
      setIsStaged(false);
      setPullUsed(true);
      toast.success(t('latest-version-pulled-successfully'));
    } catch (error) {
      toast.error(t('failed-to-pull-latest-version'));
    } finally {
      setIsPulling(false);
    }
  };

  const handlePush = async () => {
    setShowPushDialog(false);
    setIsPushing(true);
    try {
      const versionId = versionStatus?.localVersion.id;
      await pushVersion(
        teamInfo?.currentTeam?.id || '',
        currentApp?.id || '',
        versionId || ''
      );
      await refresh();
      setIsStaged(false);
      toast.success(t('changes-pushed-successfully'));
    } catch (error) {
      toast.error(t('failed-to-push-changes'));
    } finally {
      setIsPushing(false);
    }
  };

  const handleCreateNewVersion = async (version: string) => {
    if (!version) {
      toast.error(t('version-cannot-be-empty'));
      return;
    }
    try {
      setIsCreatingNewVersion(true);
      await createNewVersion(
        teamInfo?.currentTeam?.id || '',
        currentApp?.id || '',
        version
      );
      await versionStatusRefresh();
      await refresh();
      toast.success(t('new-version-created-successfully'));
    } catch (error) {
      if (error instanceof AppStoreConnectVersionConflictError) {
        toast.error(t('version-already-exists'));
      } else {
        toast.error(t('failed-to-create-new-version'));
      }
    } finally {
      setIsCreatingNewVersion(false);
    }
  };

  if (loading || versionStatusLoading || appsLoading || !teamInfo) {
    return <HomeSkeleton />;
  }

  if (!appsLoading && !apps.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('no-store-connections-found')}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('to-get-started-connect-your-store-account')}
          </p>
        </div>
        <Link
          href="/dashboard/import"
          className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors duration-200 shadow-sm"
        >
          {t('connect-store-account')}
          <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">
            {t('error-loading-localizations')}
          </p>
          <p className="text-sm text-red-400">{error}</p>
        </div>
        <Button
          onClick={refresh}
          variant="destructive"
          className="bg-red-100 hover:bg-red-200 text-red-700"
        >
          {t('try-again')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {isSaving && <LoadingOverlay />}
      {isPushing && <LoadingOverlay />}
      {isPulling && <LoadingOverlay />}
      {isRefreshing && <LoadingOverlay />}
      {isCreatingNewVersion && <LoadingOverlay />}

      <div className="flex items-center justify-between mb-6">
        {!versionStatus?.upToDate ? (
          <VersionStatusInfo
            teamId={teamInfo?.currentTeam?.id || ''}
            appId={currentApp?.id || ''}
            pullLatestVersion={handlePull}
            isRefreshing={
              versionStatusIsRefreshing || isPulling || isRefreshing
            }
          />
        ) : (
          <VersionLabel
            version={versionStatus?.localVersion.version || ''}
            state={versionStatus?.localVersion.state || ''}
          />
        )}

        {versionStatus?.upToDate && (
          <div className="flex items-center space-x-2">
            <div>
              <Button
                variant="outline"
                onClick={() => setShowPullDialog(true)}
                // disabled={isRefreshing || isPulling || pullUsed}
                className="flex items-center"
                data-tooltip-id="pull-tooltip"
              >
                <MdDownload className="w-5 h-5" />
                {t('pull')}
              </Button>
              <Tooltip id="pull-tooltip" place="top">
                {t('pull-latest-version-from-app-store-connect')}
              </Tooltip>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={`flex items-center ${
                  !isSaving && hasChanges
                    ? 'text-blue-500 hover:bg-blue-50/80'
                    : 'text-gray-400'
                }`}
                data-tooltip-id="save-tooltip"
              >
                <MdSave className="w-5 h-5" />
                {t('save')}
              </Button>
              <Tooltip id="save-tooltip" place="top">
                {t('save-changes-locally')}
              </Tooltip>
            </div>

            {!needCreateNewVersion && (
              <>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPushDialog(true)}
                    disabled={!isStaged || isPushing}
                    className={`flex items-center ${
                      isStaged && !isPushing
                        ? 'text-green-500 hover:bg-green-50/80'
                        : 'text-gray-400'
                    }`}
                    data-tooltip-id="push-tooltip"
                  >
                    <MdUpload className="w-5 h-5" />
                    {t('push')}
                  </Button>
                  <Tooltip id="push-tooltip" place="top">
                    {t('push-changes-to-app-store-connect')}
                  </Tooltip>
                </div>

                <div>
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmitDialog(true)}
                    disabled={!canSubmit}
                    className={`flex items-center ${
                      !canSubmit
                        ? 'text-gray-400'
                        : 'text-green-500 hover:bg-green-50/80'
                    }`}
                    data-tooltip-id="submit-tooltip"
                  >
                    <MdOutlineRocketLaunch className="w-5 h-5" />
                    {t('release')}
                  </Button>
                  <Tooltip id="submit-tooltip" place="top">
                    {t('submit-for-review')}
                  </Tooltip>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {versionStatus?.upToDate && (
        <>
          {needCreateNewVersion ? (
            <CreateNewVersion
              createNewVersion={handleCreateNewVersion}
              currentVersion={versionStatus?.localVersion.version || ''}
            />
          ) : Object.keys(localizations || {}).length === 0 ? (
            <NoLocalizations />
          ) : (
            <AppLocalizations
              localizations={workingLocalizations}
              saveLocalLocalizations={handleSave}
              updateLocalLocalizations={handleUpdateLocalizations}
              refresh={refresh}
            />
          )}
        </>
      )}

      {/* Pull Confirmation Dialog */}
      <AlertDialog open={showPullDialog} onOpenChange={setShowPullDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('pull-latest-version-title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('pull-latest-version-description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePull} className="ml-2">
              {t('continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Push Confirmation Dialog */}
      <AlertDialog open={showPushDialog} onOpenChange={setShowPushDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('push-changes-to-app-store-connect-title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('push-changes-to-app-store-connect-description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePush} className="ml-2">
              {t('continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SubmitDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        teamId={teamInfo?.currentTeam?.id || ''}
        appId={currentApp?.id || ''}
        versionId={versionStatus?.localVersion.id || ''}
        refresh={refresh}
      />
    </div>
  );
}
