'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';

export default function ImportKeySkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8"
    >
      {/* Title */}
      <Skeleton height={40} width={300} className="mb-8" />

      {/* Key ID section */}
      <Skeleton height={20} width={80} className="mb-2" />
      <Skeleton height={45} className="mb-6" />

      {/* Issuer ID section */}
      <Skeleton height={20} width={80} className="mb-2" />
      <Skeleton height={45} className="mb-6" />

      {/* Private Key section */}
      <Skeleton height={20} width={120} className="mb-4" />
      <Skeleton height={200} className="mb-6" />

      {/* Upload button */}
      <Skeleton height={50} borderRadius={8} />
    </motion.div>
  );
}
