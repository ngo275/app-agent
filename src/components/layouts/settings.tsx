'use client';

import Link from 'next/link';
import Image from 'next/image';
import logo from '@/assets/logo.png';
import { useWhiteLabelTranslations } from '@/hooks/useWhiteLabelTranslations';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useWhiteLabelTranslations('layout');

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Menu Bar */}
        <header className="border-b bg-newColor">
          <div className="max-w-7xl mx-auto py-4 px-6 flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center gap-1">
              <Image
                src={logo}
                alt={t('title')}
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-semibold hover:opacity-80">
                {t('title')}
              </h1>
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
