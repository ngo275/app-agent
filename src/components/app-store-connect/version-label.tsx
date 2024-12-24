import { AppStoreState } from '@/types/app-store';
import { useState, useMemo } from 'react';
import { draftVersion, publicVersion } from '@/lib/utils/versions';
import { useTranslations } from 'next-intl';

interface VersionLabelProps {
  version: string;
  state: AppStoreState;
}

export function VersionLabel({ version, state }: VersionLabelProps) {
  const t = useTranslations('dashboard.app-store-connect.localization');
  const isLatestVersionPublic = useMemo(() => publicVersion(state), [state]);
  const readableState = useMemo(() => {
    if (isLatestVersionPublic) {
      return t('public');
    }
    if (state === AppStoreState.PREPARE_FOR_SUBMISSION) {
      return t('draft');
    }
    return state.split('_').join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isLatestVersionPublic]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {t('version')}
          </span>
          <span className="px-2 py-1 text-sm font-semibold bg-gray-100 rounded-md">
            {version}
          </span>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              isLatestVersionPublic
                ? 'bg-green-100 text-green-800'
                : state === AppStoreState.PENDING_DEVELOPER_RELEASE
                  ? 'bg-yellow-100 text-yellow-800'
                  : state === AppStoreState.REJECTED
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {readableState}
          </span>
          {state === AppStoreState.REJECTED && (
            <span className="text-xs text-red-600">{t('reject-notice')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
