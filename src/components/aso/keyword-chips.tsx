import React, { useState } from 'react';
import { IoMdClose, IoMdAdd } from 'react-icons/io';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import 'react-loading-skeleton/dist/skeleton.css';
import { Tooltip } from 'react-tooltip';
import { useTranslations } from 'next-intl';

import { AsoKeyword } from '@/types/aso';
import { getChipColor } from './colors';

interface KeywordChipsProps {
  keywords: AsoKeyword[];
  readonly?: boolean;
  onAdd: (keyword: string) => Promise<void>;
  onDelete: (keywordId: string) => Promise<void>;
  isLoading?: boolean;
}

function renderTooltipContent(keyword: AsoKeyword) {
  const fields = [
    { label: 'Score', value: keyword.overall },
    { label: 'Difficulty', value: keyword.difficultyScore || null },
    { label: 'Traffic', value: keyword.trafficScore || null },
    {
      label: 'Position',
      value:
        keyword.position === null || keyword.position === -1
          ? null
          : `#${keyword.position}`,
    },
  ];

  return (
    <div className="p-2 space-y-1 text-sm">
      {fields
        .filter((field) => field.value != null)
        .map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
    </div>
  );
}

export default function KeywordChips({
  keywords,
  readonly = false,
  onAdd,
  onDelete,
  isLoading = false,
}: KeywordChipsProps) {
  const t = useTranslations('aso');
  const [loadingKeywords, setLoadingKeywords] = useState<Set<string>>(
    new Set()
  );

  const handleAddKeyword = async (value: string) => {
    if (!value.trim()) return;

    const keyword = value.trim();
    setLoadingKeywords((prev) => new Set(prev).add(keyword));

    try {
      await onAdd(keyword);
    } finally {
      setLoadingKeywords((prev) => {
        const next = new Set(prev);
        next.delete(keyword);
        return next;
      });
    }
  };

  return (
    <motion.div
      className="space-y-6 max-h-[400px] overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            // Skeleton chips
            Array(5)
              .fill(0)
              .map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center"
                >
                  <Skeleton className="rounded-full" width={80} height={32} />
                </motion.div>
              ))
          ) : (
            <>
              {keywords.map((keywordObj, index) => (
                <React.Fragment key={keywordObj.keyword}>
                  <motion.div
                    {...(keywordObj.overall !== null && {
                      'data-tooltip-id': `keyword-tooltip-${keywordObj.keyword}`,
                    })}
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${getChipColor(keywordObj.overall)}`}
                  >
                    <motion.span layout style={{ originX: 0 }}>
                      {keywordObj.keyword}
                      {keywordObj.overall !== null && (
                        <span className="ml-2 px-1.5 py-0.5 bg-background/50 rounded-full text-xs">
                          {keywordObj.overall}
                        </span>
                      )}
                      {keywordObj.position !== null &&
                        keywordObj.position >= 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            #{keywordObj.position}
                          </span>
                        )}
                      {loadingKeywords.has(keywordObj.keyword) && (
                        <span className="ml-2">
                          <Skeleton width={20} height={16} />
                        </span>
                      )}
                    </motion.span>
                    {!readonly && (
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(keywordObj.id)}
                        className="hover:bg-secondary-foreground/20 rounded-full p-1"
                      >
                        <IoMdClose className="h-3 w-3" />
                      </motion.button>
                    )}
                  </motion.div>
                  {keywordObj.overall !== null && (
                    <Tooltip
                      id={`keyword-tooltip-${keywordObj.keyword}`}
                      place="top"
                      className="z-50 max-w-md"
                      delayShow={200}
                    >
                      {renderTooltipContent(keywordObj)}
                    </Tooltip>
                  )}
                </React.Fragment>
              ))}
              {!readonly && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Input
                    placeholder={t('add-keyword-placeholder')}
                    className="h-8 w-[150px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddKeyword(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => {
                        const input = document.querySelector(
                          `input[placeholder="${t('add-keyword-placeholder')}"]`
                        ) as HTMLInputElement;
                        handleAddKeyword(input.value);
                        input.value = '';
                      }}
                    >
                      <IoMdAdd className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
