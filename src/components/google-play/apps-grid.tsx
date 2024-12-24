'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GooglePlayApp } from '@/types/google-play';
import { useTranslations } from 'next-intl';

interface GooglePlayAppsGridProps {
  apps: GooglePlayApp[];
  selectedApps: string[];
  onAppSelection: (appId: string) => void;
  onImport: () => Promise<void>;
  isLoading?: boolean;
  isImporting?: boolean;
}

export default function GooglePlayAppsGrid({
  apps,
  selectedApps,
  onAppSelection,
  onImport,
  isLoading,
  isImporting,
}: GooglePlayAppsGridProps) {
  const t = useTranslations('dashboard.google-play.localization');
  if (isLoading) {
    return <div>{t('loading-apps')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <div
            key={app.id}
            className={`p-4 border rounded-lg cursor-pointer ${
              selectedApps.includes(app.id)
                ? 'border-blue-500 bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onAppSelection(app.id)}
          >
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="font-semibold">{app.title}</h3>
                <p className="text-sm text-gray-600">{app.packageName}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {apps.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onImport}
            disabled={selectedApps.length === 0 || isImporting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isImporting
              ? t('importing')
              : t('import-apps', { count: selectedApps.length })}
          </button>
        </div>
      )}
    </div>
  );
}
