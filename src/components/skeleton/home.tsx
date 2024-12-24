'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';

export default function HomeSkeleton() {
  return (
    <div className="container mx-auto px-4">
      {/* Version status skeleton */}
      <div className="mb-6 p-4 bg-gray-100 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton circle width={20} height={20} />
            <Skeleton width={256} height={16} />
          </div>
          <Skeleton width={128} height={32} />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="mb-6 flex items-center justify-end space-x-4 bg-gray-50 p-4 rounded-lg">
        <Skeleton width={96} height={40} />
        <Skeleton width={96} height={40} />
        <Skeleton width={96} height={40} />
      </div>

      {/* Content skeleton */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton width={128} height={24} />
              <Skeleton width={96} height={24} />
            </div>
            <div className="space-y-3">
              <Skeleton width="100%" height={16} />
              <Skeleton width="75%" height={16} />
              <Skeleton width="50%" height={16} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
