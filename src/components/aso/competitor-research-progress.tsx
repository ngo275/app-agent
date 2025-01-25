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
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface CompetitorResearchProgressProps {
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
  similarApps: 'similar-apps-looked-up',
  titleSearch: 'title-search-results',
  generateKeywords: 'keywords-generated',
  searchApps: 'keyword-search-results',
  filterAppsByReviews: 'apps-filtered-by-reviews',
  filterAppsByFunction: 'apps-filtered-by-function',
  finalCompetitors: 'final-competitors',
  error: 'error',
};

function processEvents(events: any[]) {
  const processedEvents: any[] = [];
  const eventMap: Record<string, any> = {};

  events.forEach((event) => {
    if (event.type.startsWith('start:')) {
      eventMap[event.type] = event;
    } else if (event.type.startsWith('end:')) {
      const startEventType = event.type.replace('end:', 'start:');
      if (eventMap[startEventType]) {
        processedEvents.unshift({
          ...event,
          type: event.type.replace('end:', ''),
        });
        delete eventMap[startEventType];
      } else {
        processedEvents.unshift(event);
      }
    } else {
      processedEvents.unshift(event);
    }
  });

  Object.values(eventMap).forEach((startEvent) => {
    processedEvents.unshift(startEvent);
  });

  return processedEvents;
}

export default function CompetitorResearchProgress({
  events,
  isLoading,
  onRetry,
}: CompetitorResearchProgressProps) {
  const t = useTranslations('aso');
  const fixedEvents = processEvents(events);
  const hasError = events.some((event) => event.type === 'error');

  // Use useMemo for progress calculation
  const { currentStep, totalSteps, progress } = useMemo(() => {
    const latestEvent = events
      .filter((event) => !event.type.startsWith('start:'))
      .findLast((event) => event.step && event.totalSteps);

    const step = latestEvent?.step || 0;
    const total = latestEvent?.totalSteps || 6;
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
              <span>{t('error-occurred-during-competitor-research')}</span>
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
                          <span className="text-sm">
                            {t('step-index-with-message', {
                              index: event.step || 1,
                              message: event.message || getEventTitle(event, t),
                            })}
                            {event.data?.length
                              ? ` (${event.data.length})`
                              : ''}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 max-h-64 overflow-y-auto">
                      {renderEventContent(event, t)}
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

function renderEventContent(event: any, t: any) {
  if (isStartEvent(event.type)) {
    return (
      <p className="text-muted-foreground italic">
        {t('processing-in-progress')}
      </p>
    );
  }

  switch (event.type) {
    case 'similarApps':
    case 'titleSearch':
    case 'searchApps':
    case 'filterAppsByReviews':
    case 'filterAppsByFunction':
    case 'finalCompetitors':
      return (
        <ul className="space-y-1">
          {event.data?.length > 0 ? (
            event.data.map((app: any, index: number) => (
              <motion.li
                key={app.id || index}
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
            ))
          ) : (
            <li className="text-muted-foreground italic">
              {t('no-results-found')}
            </li>
          )}
        </ul>
      );

    case 'generateKeywords':
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {event.data.map((keyword: string, index: number) => (
              <div
                key={index}
                className="px-2 py-1 bg-secondary rounded-md text-sm"
              >
                {keyword}
              </div>
            ))}
          </div>
        </div>
      );

    case 'error':
      return <div className="text-destructive">{event.message}</div>;

    default:
      return null;
  }
}
