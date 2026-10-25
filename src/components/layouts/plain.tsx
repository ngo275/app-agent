import { GITHUB_LINK } from '@/lib/constants';
import Link from 'next/link';
import { ReactNode } from 'react';
import logo from '@/assets/logo.png';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface PlainLayoutProps {
  children: ReactNode;
}

export default function PlainLayout({ children }: PlainLayoutProps) {
  const t = useTranslations('layout');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Simple Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900 flex items-center gap-1"
          >
            <Image
              src={logo}
              alt={t('title')}
              width={32}
              height={32}
              className="w-8 h-8"
            />
            {t('title')}
          </Link>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-grow">{children}</main>

      <footer className="border-t border-gray-200 p-6 text-center text-sm text-gray-600">
        AppAgent is open-source software for your own environment.{' '}
        <Link
          href={GITHUB_LINK}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Source and setup instructions
        </Link>
      </footer>
    </div>
  );
}
