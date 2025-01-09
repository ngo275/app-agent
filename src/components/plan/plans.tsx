'use client';

import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { FiSearch } from 'react-icons/fi';
import { ImMagicWand } from 'react-icons/im';
import { FaAppStore } from 'react-icons/fa';
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
    videoUrl: '/videos/keyword-demo.mp4',
    delay: 0.2,
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
    videoUrl: '/videos/aso-demo.mp4',
    delay: 0.4,
  },
  {
    title: 'benefits.store-synchronization.title',
    description: 'benefits.store-synchronization.description',
    details: [
      'benefits.store-synchronization.details-1',
      'benefits.store-synchronization.details-2',
      'benefits.store-synchronization.details-3',
    ],
    icon: FaAppStore,
    videoUrl: '/videos/sync-demo.mp4',
    delay: 0.6,
  },
];

export default function Plans() {
  const t = useTranslations('plan');
  const tCommon = useTranslations('common');
  return (
    <div className="flex flex-col items-center">
      {/* Hero / Header Section */}
      <section className="w-full py-2 md:py-4 px-4 text-center">
        <div className="">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4"
          >
            {t('title')}
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-xl md:text-2xl text-gray-800 font-medium"
          >
            {t('description')}
          </motion.h2>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full px-4 py-2 md:py-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: feature.delay, duration: 0.5 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader>
                      <div className="mb-4 inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                        <Icon className="text-gray-700 w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {tCommon(feature.title)}
                      </CardTitle>
                      <CardDescription className="text-gray-700">
                        {tCommon(feature.description)}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
