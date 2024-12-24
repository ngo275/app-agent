'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetBuilds,
  selectBuild,
  submitAppVersionForReview,
} from '@/lib/swr/submission';
import { AppStoreConnectBuild } from '@/types/app-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import LoadingOverlay from '@/components/common/loading';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/lib/analytics';

interface SubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  appId: string;
  versionId: string;
  refresh: () => Promise<void>;
}

export default function SubmitDialog({
  open,
  onOpenChange,
  teamId,
  appId,
  versionId,
  refresh,
}: SubmitDialogProps) {
  const t = useTranslations('dashboard.app-store-connect.submit');
  const analytics = useAnalytics();
  const { builds, isLoading, error } = useGetBuilds(appId, versionId);
  const [selectedBuildId, setSelectedBuildId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBuild = builds?.find((build) => build.id === selectedBuildId);
  const hasEncryptionInfo =
    selectedBuild?.attributes.usesNonExemptEncryption !== null;

  const handleSubmit = async () => {
    if (!selectedBuildId) {
      toast.error(t('select-error'));
      return;
    }

    setIsSubmitting(true);
    try {
      // First select the build
      await selectBuild(teamId, appId, versionId, selectedBuildId);

      // Then submit for review
      await submitAppVersionForReview(teamId, appId, versionId);

      // Refresh the data
      await refresh();

      toast.success(t('success'));
      analytics.capture('Submitted for Review', {
        teamId: teamId,
        appId: appId,
        versionId: versionId,
        buildId: selectedBuildId,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(t('error'));
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {isSubmitting && <LoadingOverlay />}

        <div className="grid gap-4 py-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-4"
              >
                {t('loading-builds')}
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-center"
              >
                {t('failed-to-load-builds')}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Select
                  value={selectedBuildId}
                  onValueChange={setSelectedBuildId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a build" />
                  </SelectTrigger>
                  <SelectContent>
                    {builds?.map((build) => (
                      <SelectItem key={build.id} value={build.id}>
                        {t('build-name', {
                          version: build.attributes.version,
                          date: new Date(
                            build.attributes.uploadedDate
                          ).toLocaleDateString(),
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedBuildId && !hasEncryptionInfo && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 text-yellow-600 dark:text-yellow-500 text-sm"
                  >
                    {t('warning')}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedBuildId || isSubmitting || !hasEncryptionInfo}
          >
            {isSubmitting ? t('submitting') : t('submit-for-review')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
