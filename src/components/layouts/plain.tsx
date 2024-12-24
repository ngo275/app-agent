import { GITHUB_LINK, X_LINK } from '@/lib/constants';
import Link from 'next/link';
import { ReactNode } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
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

      {/* Footer */}
      <footer className="border-t border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold text-gray-900 text-lg">{t('title')}</h4>
            <p className="text-gray-600 mt-2">{t('description')}</p>
          </div>
          <div>
            <h5 className="font-semibold text-gray-900">{t('legal.title')}</h5>
            <ul className="mt-2 text-gray-600 space-y-2">
              <li>
                <Link href="/privacy" className="hover:underline">
                  {t('legal.privacy-policy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline">
                  {t('legal.terms-of-service')}
                </Link>
              </li>
              <li>
                <Link
                  href="/specified-commercial-transactions"
                  className="hover:underline"
                >
                  {t('legal.specified-commercial-transactions')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-gray-900">
              {t('connect.title')}
            </h5>
            <p className="text-gray-600 mt-2">{t('connect.description')}</p>
            <div className="mt-2 flex gap-4 text-gray-700">
              <Link href={GITHUB_LINK} aria-label="GitHub" target="_blank">
                <FaGithub className="w-5 h-5" />
              </Link>
              <Link href={X_LINK} aria-label="X (Twitter)" target="_blank">
                <FaXTwitter className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-gray-600 mt-4">
              {t('connect.contact-us')}
              <a
                href="mailto:support@app-agent.ai"
                className="text-blue-600 hover:underline"
              >
                support@app-agent.ai
              </a>
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 py-4 text-center text-gray-500 text-sm mt-8">
          {t('copyright', { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
}
