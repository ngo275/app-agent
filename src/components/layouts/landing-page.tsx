'use client';

import Link from 'next/link';
import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { X_LINK } from '@/lib/constants';
import { GITHUB_LINK } from '@/lib/constants';
import Image from 'next/image';
import logo from '@/assets/logo.png';
import { useTranslations } from 'next-intl';

interface LandingPageLayoutProps {
  children: ReactNode;
}

export default function LandingPageLayout({
  children,
}: LandingPageLayoutProps) {
  const t = useTranslations('layout');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
          <nav className="hidden md:flex items-center gap-6 text-gray-700">
            <Link href="#why" className="hover:text-black transition-colors">
              {t('why-i-built-this')}
            </Link>
            <Link
              href="#features"
              className="hover:text-black transition-colors"
            >
              {t('features')}
            </Link>
            <Link
              href="#pricing"
              className="hover:text-black transition-colors"
            >
              {t('pricing')}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="w-28 gap-2 text-base"
            >
              <Link
                href={GITHUB_LINK}
                target="_blank"
                aria-label="View source code on GitHub"
              >
                <FaGithub className="w-5 h-5" /> {t('star-us')}
              </Link>
            </Button>
            <Button variant="default" asChild>
              <Link href="/login">{t('login')}</Link>
            </Button>
          </nav>

          <button
            className="md:hidden text-gray-700 text-2xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 px-4 py-4">
            <div className="flex flex-col gap-4">
              <Link href="#why" className="hover:text-black transition-colors">
                {t('why-i-built-this')}
              </Link>
              <Link
                href="#features"
                className="hover:text-black transition-colors"
              >
                {t('features')}
              </Link>
              <Link
                href="#open-source"
                className="hover:text-black transition-colors"
              >
                {t('open-source')}
              </Link>
              <Link
                href="#pricing"
                className="hover:text-black transition-colors"
              >
                {t('pricing')}
              </Link>
              <Link
                href={GITHUB_LINK}
                target="_blank"
                className="hover:text-black transition-colors flex items-center gap-2"
              >
                <FaGithub className="w-5 h-5" /> {t('star-us')}
              </Link>
              <Link
                href="/login"
                className="hover:text-black transition-colors"
              >
                {t('login')}
              </Link>
            </div>
          </div>
        )}
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
            <h5 className="font-semibold text-gray-900">{t('quick-links')}</h5>
            <ul className="mt-2 text-gray-600 space-y-2">
              <li>
                <Link href="#why" className="hover:underline">
                  {t('why-i-built-this')}
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:underline">
                  {t('features')}
                </Link>
              </li>
              <li>
                <Link href="#open-source" className="hover:underline">
                  {t('open-source')}
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:underline">
                  {t('pricing')}
                </Link>
              </li>
            </ul>
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
