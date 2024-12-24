import { RefreshFunction } from '@/types/common';
import { useTranslations } from 'next-intl';

interface AppStoreAgreementErrorProps {
  onRefresh: RefreshFunction;
}

export function AppStoreConnectAgreementError({
  onRefresh,
}: AppStoreAgreementErrorProps) {
  const t = useTranslations('dashboard.app-store-connect.localization');
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="text-amber-500 text-center">
        <p className="text-lg font-medium">{t('agreement-required')}</p>
        <p className="text-sm text-amber-600 max-w-md mt-2">
          {t('agreement-required-description')}
        </p>
        <p className="text-xs text-amber-600 max-w-md mt-2">
          {t('agreement-required-note')}
        </p>
      </div>
      <a
        href="https://appstoreconnect.apple.com"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
      >
        {t('visit-app-store-connect')}
      </a>
      <button
        onClick={onRefresh}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        {t('refresh-status')}
      </button>
    </div>
  );
}
