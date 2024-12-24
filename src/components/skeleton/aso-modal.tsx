'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';

export default function ASOModalSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      // className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl min-h-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton width={200} height={24} />
          <Skeleton circle width={32} height={32} />
        </div>

        {/* Form fields */}
        <div className="space-y-6">
          {/* Input fields */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton width={120} height={16} />
                <Skeleton width="100%" height={40} />
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Skeleton width={100} height={40} />
            <Skeleton width={100} height={40} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
