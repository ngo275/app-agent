import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (version: string) => Promise<void>;
}

export function CreateVersionModal({
  isOpen,
  onClose,
  onUpdate,
}: CreateVersionModalProps) {
  const [newVersion, setNewVersion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('dashboard.app-store-connect.localization');

  const handleUpdateVersion = async () => {
    if (!newVersion) return;
    setIsLoading(true);
    try {
      await onUpdate(newVersion);
      onClose();
    } catch (error) {
      console.error('Failed to update version:', error);
    } finally {
      setIsLoading(false);
      setNewVersion('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
          <h3 className="text-lg font-medium text-gray-900">
            {t('create-new-version')}
          </h3>

          <div className="mt-4">
            <input
              type="text"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder={t('new-version-number')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleUpdateVersion}
              disabled={isLoading || !newVersion}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('creating-version') : t('create-version')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
