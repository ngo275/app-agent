'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { ImMagicWand } from 'react-icons/im';
import { FaAppStore } from 'react-icons/fa';
import { MdOutlineRocketLaunch } from 'react-icons/md';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { GITHUB_LINK } from '@/lib/constants';
import { useTranslations } from 'next-intl';

const features = [
  {
    title: 'benefits.autonomous-keyword-research.title',
    description: 'benefits.autonomous-keyword-research.description',
    details: [
      'benefits.autonomous-keyword-research.details-1',
      'benefits.autonomous-keyword-research.details-2',
      'benefits.autonomous-keyword-research.details-3',
    ],
    icon: FiSearch,
  },
  {
    title: 'benefits.ai-powered-store-optimization.title',
    description: 'benefits.ai-powered-store-optimization.description',
    details: [
      'benefits.ai-powered-store-optimization.details-1',
      'benefits.ai-powered-store-optimization.details-2',
      'benefits.ai-powered-store-optimization.details-3',
    ],
    icon: ImMagicWand,
  },
  {
    title: 'benefits.store-synchronization.title',
    description: 'benefits.store-synchronization.description',
    details: [
      'benefits.store-synchronization.details-1',
      'benefits.store-synchronization.details-2',
      'benefits.store-synchronization.details-3',
      'benefits.store-synchronization.details-4',
    ],
    icon: FaAppStore,
  },
  {
    title: 'benefits.keyword-tracking-self-healing.title',
    description: 'benefits.keyword-tracking-self-healing.description',
    details: [
      'benefits.keyword-tracking-self-healing.details-1',
      'benefits.keyword-tracking-self-healing.details-2',
      'benefits.keyword-tracking-self-healing.details-3',
      'benefits.keyword-tracking-self-healing.details-4',
    ],
    icon: MdOutlineRocketLaunch,
  },
];

export default function LandingPageView() {
  const t = useTranslations('landing-page');
  const tCommon = useTranslations('common');
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Once the component is mounted, trigger the CSS transitions
    setMounted(true);
  }, []);

  const openFeatureModal = (idx: number) => {
    setSelectedFeature(idx);
  };

  const closeModal = () => {
    setSelectedFeature(null);
  };

  const currentFeature =
    selectedFeature !== null ? features[selectedFeature] : null;

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-12 md:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1
            className={`text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 transition-all duration-500 transform ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('title')}
          </h1>

          <h2
            className={`text-lg md:text-2xl text-gray-800 mb-6 font-medium transition-all duration-500 delay-100 transform ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('tagline')}
          </h2>

          <p
            className={`text-base md:text-lg text-gray-700 max-w-2xl mx-auto mb-4 px-4 transition-all duration-500 delay-200 transform ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('description')}
          </p>

          <div
            className={`transition-all duration-500 delay-300 transform ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Button size="lg" className="px-6 md:px-8 py-2 md:py-3" asChild>
              <Link href="/dashboard">{t('get-started-now')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {t('see-appagent-in-action')}
          </h2>
          <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg transition-opacity duration-500 transform">
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
              muted
              // poster="/video-thumbnail.jpg"
              preload="auto"
            >
              <source
                src="https://assets.app-agent.ai/assets/videos/introduction.mp4"
                type="video/mp4"
              />
              {t('your-browser-does-not-support-the-video-tag')}
            </video>
          </div>
        </div>
      </section>

      {/* Why I Built This Section */}
      <section
        id="why"
        className="py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50"
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('why-i-built-this')}
            </h2>
            <p className="text-gray-700 text-lg mb-6 leading-relaxed">
              {t('reason-one')}
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {t('reason-two')}
            </p>
          </div>
          <div className="flex justify-center">
            {/* Placeholder graphic */}
            <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-6xl">
              ⚙️
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <Button size="lg" className="px-6 py-3" asChild>
            <Link href="/dashboard">{t('start-optimizing-now')}</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
            {t('key-features')}
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            {t('key-features-description')}
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <button
                key={idx}
                onClick={() => openFeatureModal(idx)}
                className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-md transition-all text-left w-full hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <div className="relative">
                  {idx === 3 && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {tCommon('coming-soon')}
                    </span>
                  )}
                  <div className="mb-3 md:mb-4 inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100">
                    <Icon className="text-gray-700 w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    {tCommon(feature.title)}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">
                    {tCommon(feature.description)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10 md:mt-12">
          <Button size="lg" className="px-8 py-3" asChild>
            <Link href="/dashboard">{t('get-started-now')}</Link>
          </Button>
        </div>
      </section>

      {/* Feature Modal */}
      <Dialog
        open={selectedFeature !== null}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {tCommon(currentFeature?.title)}
            </DialogTitle>
            <DialogDescription className="text-gray-700 mt-3">
              {tCommon(currentFeature?.description)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {currentFeature?.details.map((detail, i) => (
                <li key={i}>{tCommon(detail)}</li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">{t('close')}</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Open Source Section */}
      <section
        id="open-source"
        className="py-20 px-4 bg-gradient-to-br from-purple-50 via-white to-blue-50"
      >
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('open-source')}
          </h2>
          <p className="text-gray-700 text-lg mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('open-source-description')}
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('open-source-community-driven')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('open-source-community-driven-description')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('open-source-transparent')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('open-source-transparent-description')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('open-source-full-data-ownership')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('open-source-full-data-ownership-description')}
              </p>
            </div>
          </div>

          <div className="hidden md:block bg-gray-100 p-6 rounded-lg inline-block">
            <p className="font-mono text-gray-700 text-sm mb-4">
              {`# ${t('clone-the-repo')}`}
            </p>
            <pre className="bg-white p-4 rounded-md text-left overflow-x-auto text-sm text-gray-800">
              {`git clone https://github.com/ngo275/app-agent.git
cd app-agent
yarn
yarn dev`}
            </pre>
          </div>

          <div className="mt-8">
            <Button size="lg" className="px-8 py-3">
              <a href={GITHUB_LINK} target="_blank" rel="noopener noreferrer">
                {t('visit-github')}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('pricing')}
          </h2>
          <p className="text-gray-700 text-lg mb-8 leading-relaxed max-w-3xl mx-auto">
            {t('pricing-description')}
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            {/* Free Self-Hosted */}
            <div className="bg-white rounded-lg p-8 shadow hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t('free-self-hosted')}
              </h3>
              <span className="text-4xl font-extrabold text-gray-900">
                {t('free')}
              </span>
              <div className="mb-6 mt-4">
                <Link
                  href={GITHUB_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {t('view-on-github')}
                </Link>
              </div>
              <ul className="text-left text-gray-700 space-y-2 list-disc list-inside">
                <li>{t('full-access-to-source-code')}</li>
                <li>{t('host-anywhere-you-like')}</li>
              </ul>
            </div>

            {/* Paid Subscription */}
            <div className="bg-white rounded-lg p-8 shadow hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t('paid-subscription')}
              </h3>
              <span className="text-4xl font-extrabold text-gray-900">$29</span>
              <span className="text-gray-700 ml-1">{t('per-month')}</span>
              <div className="mb-6 mt-4">
                <Link href="/dashboard">
                  <Button size="lg" className="px-8 py-3">
                    {t('get-started-now')}
                  </Button>
                </Link>
              </div>
              <ul className="text-left text-gray-700 space-y-2 list-disc list-inside">
                <li>{t('cloud-hosted-no-need-to-self-host')}</li>
                <li>{t('just-sign-up-and-start-optimizing')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Second CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('ready-to-try-appagent')}
          </h2>
          <p className="text-gray-700 text-lg mb-8">
            {t('ready-to-try-appagent-description')}
          </p>
          <Button size="lg" className="px-8 py-3" asChild>
            <Link href="/dashboard">{t('get-started-now')}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
