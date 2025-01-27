import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import { CompetitorKeyword } from '@/types/aso';
import { getChipColor } from './colors';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface CompetitorKeywordsProps {
  keywords: CompetitorKeyword[];
  isLoading?: boolean;
}

function renderTooltipContent(
  keyword: CompetitorKeyword,
  t: (key: string, options?: any) => string
) {
  return (
    <div className="p-2 space-y-1 text-sm">
      <div className="text-muted-foreground mb-2">
        {t('used-by-competitors', { count: keyword.competitors.length })}
      </div>
      <ul className="space-y-1">
        {keyword.competitors.map((competitor) => (
          <li key={competitor.id} className="flex items-center gap-2">
            {competitor.iconUrl && (
              <Image
                src={competitor.iconUrl}
                alt={competitor.title}
                width={16}
                height={16}
                className="rounded"
                unoptimized
              />
            )}
            {competitor.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CompetitorKeywords({
  keywords,
  isLoading = false,
}: CompetitorKeywordsProps) {
  const t = useTranslations('aso');
  return (
    <motion.div
      className="space-y-6 max-h-[400px] overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {keywords.map((keywordObj) => (
            <React.Fragment key={keywordObj.keyword}>
              <motion.div
                data-tooltip-id={`competitor-keyword-tooltip-${keywordObj.keyword}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  rotate: 20,
                  x: -20,
                  transition: {
                    duration: 0.2,
                    ease: 'backIn',
                  },
                }}
                layout
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${getChipColor(null)}`}
              >
                <motion.span layout style={{ originX: 0 }}>
                  {keywordObj.keyword}
                  <span className="ml-2 px-1.5 py-0.5 bg-background/50 rounded-full text-xs">
                    {keywordObj.competitors.length}
                  </span>
                </motion.span>
              </motion.div>
              <Tooltip
                id={`competitor-keyword-tooltip-${keywordObj.keyword}`}
                place="top"
                className="z-50 max-w-md"
                delayShow={200}
              >
                {renderTooltipContent(keywordObj, t)}
              </Tooltip>
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
