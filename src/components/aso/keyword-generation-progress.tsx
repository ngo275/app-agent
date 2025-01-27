import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FiCheck, FiX } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import KeywordChips from '@/components/aso/keyword-chips';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { CompetitorKeyword } from '@/types/aso';
import CompetitorKeywords from './competitor-keywords';

interface KeywordGenerationProgressProps {
  events: any[];
  isLoading: boolean;
  onRetry: () => void;
}

function isStartEvent(type: string) {
  return type.startsWith('start:');
}

function getEventTitle(event: any, t: any) {
  return (
    t(`event-titles.${eventTitles[event.type as keyof typeof eventTitles]}`) ||
    event.type
  );
}

const eventTitles = {
  log: 'log',
  similarApps: 'similar-apps-looked-up',
  scoreCurrentKeywords: 'current-keywords-scored',
  highScoringCurrentKeywords: 'high-performing-current-keywords',
  searchApps: 'more-competitor-apps-found',
  filterAppsByReviews: 'competitor-apps-excluded-by-reviews',
  filterAppsByShortDescription: 'competitor-apps-filtered-by-description',
  topCompetitorApps: 'competitor-apps-finalized',
  extractKeywordsFromCompetitors: 'keywords-extracted-from-competitors',
  rerankKeywords: 'new-keywords-reranked',
  keywordsToResearch: 'new-keywords-to-research',
  scoreKeywords: 'all-keywords-scored',
  reviewLanguage: 'keywords-language-checked',
  changeStrategy: 'keyword-hunting-strategy-changed',
  generateAsoKeywords: 'potential-keywords-generated',
  finalSanityCheck: 'final-sanity-check-done',
  finalKeywords: 'final-keywords',
  error: 'error',
};

function processEvents(events: any[]) {
  const processedEvents: any[] = [];
  const eventMap: Record<string, any> = {};
  const seenSteps = new Set<number>();

  events
    .filter((event) => event.type !== 'log')
    .forEach((event) => {
      // Skip duplicate step numbers for completed events
      if (
        !event.type.startsWith('start:') &&
        event.step &&
        seenSteps.has(event.step)
      ) {
        return;
      }

      if (event.type.startsWith('start:')) {
        eventMap[event.type] = {
          ...event,
          processData: [], // Initialize array to store process events
        };
      } else if (event.type.startsWith('end:')) {
        const startEventType = event.type.replace('end:', 'start:');
        if (eventMap[startEventType]) {
          if (event.step) {
            seenSteps.add(event.step);
          }
          processedEvents.unshift({
            ...event,
            type: event.type.replace('end:', ''),
            processData: eventMap[startEventType].processData, // Include collected process data
          });
          delete eventMap[startEventType];
        } else {
          if (event.step) {
            seenSteps.add(event.step);
          }
          processedEvents.unshift(event);
        }
      } else if (event.type === 'process:scoreKeyword') {
        // Add process data to the corresponding start event
        if (eventMap['start:scoreKeywords']) {
          eventMap['start:scoreKeywords'].processData.push(event.data);
        }
      } else {
        if (event.step) {
          seenSteps.add(event.step);
        }
        processedEvents.unshift(event);
      }
    });

  // Add any remaining start events
  Object.values(eventMap).forEach((startEvent) => {
    processedEvents.unshift(startEvent);
  });

  // Sort events by step number to ensure correct order
  return processedEvents.sort((a, b) => {
    // Put start events first for the same step
    if (a.step === b.step) {
      return isStartEvent(a.type) ? -1 : 1;
    }
    // Sort by step number
    return (b.step || 0) - (a.step || 0);
  });
}

export default function KeywordGenerationProgress({
  events,
  isLoading,
  onRetry,
}: KeywordGenerationProgressProps) {
  const t = useTranslations('aso');
  const fixedEvents = processEvents(events);
  const hasError = events.some((event) => event.type === 'error');

  // Use useMemo for progress calculation
  const { currentStep, totalSteps, progress } = useMemo(() => {
    const latestEvent = events
      .filter((event) => !event.type.startsWith('start:'))
      .findLast((event) => event.step && event.totalSteps);

    const step = latestEvent?.step || 0;
    const total = latestEvent?.totalSteps || 4;
    const calculatedProgress = isLoading
      ? Math.min((step / total) * 100, 100)
      : 100;

    return {
      currentStep: step,
      totalSteps: total,
      progress: calculatedProgress,
    };
  }, [events, isLoading]);

  return (
    <motion.div
      className="flex flex-col max-h-[600px] overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            {isLoading ? t('working-hard') : t('completed')}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Progress value={progress} className="h-2" />
        </motion.div>
      </div>

      {hasError && (
        <div className="mb-4 p-4 border border-destructive rounded-lg bg-destructive/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive">
              <FiX className="h-5 w-5" />
              <span>{t('error-occurred-during-keyword-generation')}</span>
            </div>
            <Button variant="secondary" onClick={onRetry} disabled={isLoading}>
              {t('try-again')}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-2 flex-1 h-full overflow-hidden">
        <ScrollArea className="h-[450px]">
          <Accordion type="single" collapsible className="space-y-2">
            <AnimatePresence initial={false}>
              {fixedEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccordionItem
                    value={`item-${index}`}
                    className="border rounded-lg"
                  >
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        {event.type === 'error' ? (
                          <div className="flex items-center justify-center w-5 h-5 bg-destructive rounded-full">
                            <FiX className="h-3 w-3 text-white" />
                          </div>
                        ) : isStartEvent(event.type) ? (
                          <AiOutlineLoading3Quarters className="h-3 w-3 animate-spin" />
                        ) : (
                          <div className="flex items-center justify-center w-4 h-4 bg-green-600 rounded-full">
                            <FiCheck className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col items-start gap-1">
                          {event.message && event.type !== 'log' ? (
                            <span
                              className={cn(
                                'text-sm',
                                event.type === 'error'
                                  ? 'text-destructive'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {t('step-index-with-message', {
                                index: event.step || 1,
                                message: event.message,
                              })}
                            </span>
                          ) : (
                            <span className="text-sm">
                              {t('step-index-with-message', {
                                index: event.step || 1,
                                message: getEventTitle(event, t),
                              })}
                              {event.data?.length
                                ? `(${event.data.length})`
                                : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 max-h-64 overflow-y-auto">
                      {isStartEvent(event.type)
                        ? renderProcessingEventContent(event, t)
                        : renderCompletedEventContent(event, t)}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </Accordion>
        </ScrollArea>
      </div>
    </motion.div>
  );
}

function renderProcessingEventContent(event: any, t: any) {
  switch (event.type) {
    case 'start:scoreKeywords':
      return (
        <div className="space-y-2 mb-4">
          <div className="text-sm font-medium">{t('processing-keywords')}:</div>
          <div className="max-h-40 overflow-y-auto">
            {event.processData.map((processData: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-[1fr,auto,auto,auto] gap-2 text-sm"
              >
                <div className="font-medium truncate">
                  {processData.keyword}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">
                    {t('traffic-score')}:
                  </span>
                  <span>{processData.trafficScore}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">
                    {t('difficulty-score')}:
                  </span>
                  <span>{processData.difficultyScore}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">
                    {t('overall-score')}:
                  </span>
                  <span>{processData.overall}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <p className="text-muted-foreground italic">
          {t('processing-in-progress')}
        </p>
      );
  }
}

function renderCompletedEventContent(event: any, t: any) {
  switch (event.type) {
    case 'similarApps':
    case 'searchApps':
    case 'competitorApps':
    case 'filterAppsByReviews':
    case 'filterAppsByShortDescription':
    case 'topCompetitorApps':
      return (
        <ul className="space-y-1">
          {event.data.map((app: any, index: number) => (
            <motion.li
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:bg-secondary/50 p-2 rounded-md transition-colors"
              >
                {app.icon && (
                  <Image
                    src={app.icon}
                    alt={app.title}
                    width={24}
                    height={24}
                    className="rounded"
                    unoptimized
                  />
                )}
                <span>{app.title}</span>
                <span className="text-xs text-muted-foreground">
                  {t('reviews', { reviews: `${app.reviews || 0}` })}
                </span>
              </a>
            </motion.li>
          ))}
        </ul>
      );

    case 'scoreCurrentKeywords':
    case 'highScoringCurrentKeywords':
    case 'scoreKeywords':
    case 'finalKeywords':
      return (
        <div className="space-y-4">
          <KeywordChips
            keywords={event.data}
            readonly={true}
            onAdd={async () => {}}
            onDelete={async () => {}}
          />
        </div>
      );

    case 'extractKeywordsFromCompetitors':
    case 'rerankKeywords':
      return (
        <div className="space-y-2">
          <CompetitorKeywords keywords={event.data} isLoading={false} />
        </div>
      );
    case 'keywordsToResearch':
    case 'generateAsoKeywords':
      return (
        <div className="space-y-2">
          <KeywordChips
            keywords={event.data.map((keyword: string) => ({
              id: keyword,
              keyword: keyword,
              overall: null,
              difficultyScore: null,
              trafficScore: null,
              position: null,
            }))}
            readonly={true}
            onAdd={async () => {}}
            onDelete={async () => {}}
          />
        </div>
      );

    case 'reviewLanguage':
    case 'changeStrategy':
      return (
        <div className="text-muted-foreground italic">
          {event.data.description}
        </div>
      );

    case 'error':
      return <div className="text-destructive">{event.message}</div>;

    default:
      return null;
  }
}
