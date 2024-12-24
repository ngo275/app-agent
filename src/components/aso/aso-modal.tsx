// This component (ASO modal) is a modal view responsible for managing ASO (keywords, title, subtitle, and description)
// The concept is that
// 1. The UI suggests good keywords after doing a research on the fly.
// 2. A user confirms or modify it.
// 3. The UI asks the user to provide
//    - which field(s) to generate (title, subtitle, and/or description)
//    - outline for the description (optiional) if description is checked.
// 4. The UI then makes suggestion for title, subtitle, and description. This should also show a regenerate button with a feedback input field. This regenerate action should allow the user to select which field to regenerate, while the UI shows one feedback input.
// 5. A user confirms or modify it, or regenerate with their feedback. This regenerate action will need the previous result (without using user modification), the user feedback, and which fields to regenerate.

// 2 and 5 need backend process.
// Keyword suggestion:
// suggestKeywords function
//
// Title, subtitle, description suggestion:
// optimizeContents function

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  addKeyword,
  deleteKeyword,
  suggestKeywords,
  useGetAsoKeywords,
} from '@/lib/swr/aso';
import { useTeam } from '@/context/team';
import { optimizeContents } from '@/lib/swr/aso';
import { getLocaleName, LocaleCode } from '@/lib/utils/locale';
import { useApp } from '@/context/app';
import { AsoTarget, AsoKeyword, AsoContent } from '@/types/aso';
import KeywordChips from '@/components/aso/keyword-chips';
import StartResearch from '@/components/aso/start-research';
import ASOModalSkeleton from '../skeleton/aso-modal';
import SelectFields from '@/components/aso/select-fields';
import toast from 'react-hot-toast';
import GenerateContentsView from '@/components/aso/generate-contents';
import { IoMdArrowBack } from 'react-icons/io';
import KeywordGenerationProgress from '@/components/aso/keyword-generation-progress';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/lib/analytics';

interface ASOModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: AsoContent;
  onSave: (values: AsoContent) => void;
  locale: LocaleCode;
}

export function ASOModal({
  isOpen,
  onClose,
  initialValues,
  onSave,
  locale,
}: ASOModalProps) {
  const teamInfo = useTeam();
  const appInfo = useApp();
  const t = useTranslations('aso');
  const analytics = useAnalytics();
  const asoKeywords = useGetAsoKeywords(appInfo?.currentApp?.id || '', locale);
  const [step, setStep] = useState(0);
  const [keywords, setKeywords] = useState<AsoKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shortDescription, setShortDescription] = useState(
    appInfo.currentApp?.shortDescription || ''
  );
  const isKeywordsLoading = asoKeywords.loading;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] =
    useState<AsoContent>(initialValues);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (asoKeywords.keywords) {
      setKeywords(asoKeywords.keywords);
      // Only auto-advance to step 2 on initial load
      if (step === 0 && asoKeywords.keywords.length > 0 && !isLoading) {
        setStep(2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asoKeywords.keywords]);

  useEffect(() => {
    if (step === 1 && events.length === 0 && !isLoading) {
      setStep(0);
    }
  }, [step, isLoading, events]);

  const handleKeywordSuggestion = async () => {
    if (!teamInfo?.currentTeam?.id || !appInfo.currentApp?.id) {
      return;
    }
    setIsLoading(true);
    setStep(1);
    setEvents([]);
    try {
      analytics.capture('Keyword Suggestion Started', {
        teamId: teamInfo?.currentTeam?.id,
        appId: appInfo.currentApp?.id,
        locale: locale,
      });
      await suggestKeywords(
        teamInfo.currentTeam.id,
        appInfo.currentApp.id,
        locale,
        shortDescription,
        appInfo.currentApp?.store,
        appInfo.currentApp?.platform,
        (data: any) => {
          setEvents((prevEvents) => [...prevEvents, data]);
          if (data.type === 'finalKeywords') {
            setKeywords(data.data);
            setIsLoading(false);
            setStep(2);
            analytics.capture('Keywords Suggested', {
              teamId: teamInfo?.currentTeam?.id,
              appId: appInfo.currentApp?.id,
              locale: locale,
            });
          }
        }
      );
    } catch (error) {
      toast.error(t('failed-to-suggest-keywords'));
      setEvents((prevEvents) => {
        // If last event is a start event, replace it with error
        if (
          prevEvents.length > 0 &&
          prevEvents[prevEvents.length - 1].type.startsWith('start:')
        ) {
          return [
            ...prevEvents.slice(0, -1),
            {
              type: 'error',
              message: t('failed-to-suggest-keywords'),
            },
          ];
        }
        // Otherwise append error event
        return [
          ...prevEvents,
          {
            type: 'error',
            message: t('failed-to-suggest-keywords'),
          },
        ];
      });
      setIsLoading(false);
    }
  };

  const handleContentOptimization = async (
    selectedFields: {
      title: boolean;
      subtitle: boolean;
      description: boolean;
      keywords: boolean;
    },
    outline: string
  ) => {
    if (!teamInfo?.currentTeam?.id || !appInfo.currentApp?.id) return;

    setIsGenerating(true);
    setStep(4);

    analytics.capture('Content Optimization Started', {
      teamId: teamInfo?.currentTeam?.id,
      appId: appInfo.currentApp?.id,
      locale: locale,
    });

    const targets: AsoTarget[] = [];
    if (selectedFields.title) targets.push(AsoTarget.title);
    if (selectedFields.subtitle) targets.push(AsoTarget.subtitle);
    if (selectedFields.description) targets.push(AsoTarget.description);
    if (selectedFields.keywords) targets.push(AsoTarget.keywords);

    try {
      const result = await optimizeContents(
        teamInfo.currentTeam.id,
        appInfo.currentApp.id,
        locale,
        initialValues.title,
        keywords,
        targets,
        initialValues.subtitle,
        initialValues.keywords,
        initialValues.description,
        outline
      );
      setGeneratedContent(result);
      analytics.capture('Content Optimization Completed', {
        teamId: teamInfo?.currentTeam?.id,
        appId: appInfo.currentApp?.id,
        locale: locale,
      });
      return result;
    } catch (error) {
      toast.error(t('failed-to-optimize-contents'));
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (
    selectedFields: {
      title: boolean;
      subtitle: boolean;
      description: boolean;
      keywords: boolean;
    },
    feedback: string,
    previousResults: typeof initialValues
  ) => {
    if (!teamInfo?.currentTeam?.id || !appInfo.currentApp?.id) return;
    setIsGenerating(true);

    const targets: AsoTarget[] = [];
    if (selectedFields.title) targets.push(AsoTarget.title);
    if (selectedFields.subtitle) targets.push(AsoTarget.subtitle);
    if (selectedFields.description) targets.push(AsoTarget.description);
    if (selectedFields.keywords) targets.push(AsoTarget.keywords);

    try {
      const result = await optimizeContents(
        teamInfo.currentTeam.id,
        appInfo.currentApp.id,
        locale,
        initialValues.title,
        keywords,
        targets,
        initialValues.subtitle,
        initialValues.keywords,
        initialValues.description,
        '',
        previousResults,
        feedback
      );
      setGeneratedContent(result);
      analytics.capture('Content Regenerated', {
        teamId: teamInfo?.currentTeam?.id,
        appId: appInfo.currentApp?.id,
        locale: locale,
      });
      return result;
    } catch (error) {
      toast.error(t('failed-to-regenerate-contents'));
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeywordAdd = async (keyword: string) => {
    if (!teamInfo?.currentTeam?.id || !appInfo.currentApp?.id) return;

    const tempKeyword: AsoKeyword = {
      id: `temp-${keyword}`,
      keyword,
      overall: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      store: appInfo.currentApp?.store || 'APPSTORE',
      platform: appInfo.currentApp?.platform || 'IOS',
      locale,
      appId: appInfo.currentApp?.id || '',
      trafficScore: null,
      difficultyScore: null,
      position: null,
      lastCheckedAt: new Date(),
    };

    setKeywords((prev) => [...prev, tempKeyword]);

    try {
      const newKeyword = await addKeyword(
        teamInfo.currentTeam.id,
        appInfo.currentApp.id,
        locale,
        keyword
      );
      setKeywords((prev) =>
        prev.map((k) => (k.id === tempKeyword.id ? newKeyword : k))
      );
      analytics.capture('Keyword Added', {
        teamId: teamInfo?.currentTeam?.id,
        appId: appInfo.currentApp?.id,
        locale: locale,
        keyword: keyword,
      });
    } catch (error) {
      setKeywords((prev) => prev.filter((k) => k.id !== tempKeyword.id));
      toast.error(t('failed-to-add-keyword'));
    }
  };

  const handleKeywordDelete = async (keywordId: string) => {
    if (!teamInfo?.currentTeam?.id || !appInfo.currentApp?.id) return;

    try {
      await deleteKeyword(
        teamInfo.currentTeam.id,
        appInfo.currentApp.id,
        locale,
        keywordId
      );
      setKeywords((prev) => prev.filter((k) => k.id !== keywordId));
      analytics.capture('Keyword Deleted', {
        teamId: teamInfo?.currentTeam?.id,
        appId: appInfo.currentApp?.id,
        locale: locale,
        keywordId: keywordId,
      });
    } catch (error) {
      toast.error(t('failed-to-delete-keyword'));
    }
  };

  const handleSaveContent = (values: AsoContent) => {
    setGeneratedContent(values);
    onSave(values);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (step === 1) {
                    setKeywords([]);
                  }
                  setStep((prev) => prev - 1);
                }}
              >
                <IoMdArrowBack className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="m-0">
              {step === 0 &&
                t('keyword-research', { locale: getLocaleName(locale) })}
              {step === 1 &&
                t('generating-keywords', { locale: getLocaleName(locale) })}
              {step === 2 &&
                t('confirm-keywords', { locale: getLocaleName(locale) })}
              {step === 3 &&
                t('select-fields-to-generate', {
                  locale: getLocaleName(locale),
                })}
              {step === 4 &&
                t('review-generated-contents', {
                  locale: getLocaleName(locale),
                })}
            </DialogTitle>
          </div>
        </DialogHeader>

        {isKeywordsLoading ? (
          <div className="space-y-4">
            <ASOModalSkeleton />
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {step === 0 && (
              <div className="space-y-4">
                <StartResearch
                  shortDescription={shortDescription}
                  setShortDescription={setShortDescription}
                  onStart={handleKeywordSuggestion}
                  isLoading={isLoading}
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <KeywordGenerationProgress
                  events={events}
                  isLoading={isLoading}
                  onRetry={handleKeywordSuggestion}
                />
                {!isLoading &&
                  !events.some((event) => event.type === 'error') && (
                    <div className="flex justify-end">
                      <Button onClick={() => setStep(2)} disabled={isLoading}>
                        {t('confirm-keywords-title')}
                      </Button>
                    </div>
                  )}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-auto">
                  <KeywordChips
                    keywords={keywords}
                    onAdd={handleKeywordAdd}
                    onDelete={handleKeywordDelete}
                    isLoading={isLoading}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 mt-auto">
                  <Button
                    variant="outline"
                    onClick={handleKeywordSuggestion}
                    disabled={isLoading}
                  >
                    {t('regenerate-keywords')}
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={isLoading}>
                    {t('confirm-aso-keywords')}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <SelectFields
                store={appInfo.currentApp?.store || 'APPSTORE'}
                currentValues={initialValues}
                onGenerate={handleContentOptimization}
              />
            )}

            {step === 4 && (
              <GenerateContentsView
                isGenerating={isGenerating}
                store={appInfo.currentApp?.store || 'APPSTORE'}
                generatedContent={generatedContent}
                onRegenerate={handleRegenerate}
                onSave={handleSaveContent}
                onClose={onClose}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
