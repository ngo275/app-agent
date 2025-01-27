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
  useGetAsoKeywords,
  researchCompetitors,
  selectAndScoreKeywords,
  useGetCompetitors,
  addCompetitor,
  deleteCompetitor,
} from '@/lib/swr/aso';
import { useTeam } from '@/context/team';
import { optimizeContents } from '@/lib/swr/aso';
import { getLocaleName, LocaleCode } from '@/lib/utils/locale';
import { useApp } from '@/context/app';
import { AsoTarget, AsoKeyword, AsoContent, Competitor } from '@/types/aso';
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
import CompetitorResearchProgress from '@/components/aso/competitor-research-progress';
import CompetitorList from '@/components/aso/competitor-list';
import { AppStoreApp } from '@/types/app-store';

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
  const asoCompetitors = useGetCompetitors(
    appInfo?.currentApp?.id || '',
    locale
  );
  const [step, setStep] = useState(0);
  const [keywords, setKeywords] = useState<AsoKeyword[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shortDescription, setShortDescription] = useState(
    appInfo.currentApp?.shortDescription || ''
  );
  const isKeywordsLoading = asoKeywords.loading;
  const isCompetitorsLoading = asoCompetitors.loading;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] =
    useState<AsoContent>(initialValues);
  const [competitorEvents, setCompetitorEvents] = useState<any[]>([]);
  const [keywordEvents, setKeywordEvents] = useState<any[]>([]);

  // when opening the modal
  useEffect(() => {
    if (asoCompetitors.competitors) {
      setCompetitors(asoCompetitors.competitors);
      if (step === 0 && asoCompetitors.competitors.length > 0 && !isLoading) {
        if (asoKeywords.keywords && asoKeywords.keywords.length > 0) {
          setStep(4);
        } else {
          setStep(2);
        }
      }
    }
  }, [asoCompetitors.competitors]);

  // when opening the modal
  useEffect(() => {
    if (asoKeywords.keywords) {
      setKeywords(asoKeywords.keywords);
      if (step === 3 && asoKeywords.keywords.length > 0 && !isLoading) {
        setStep(4);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asoKeywords.keywords]);

  // when going back from competitor research
  useEffect(() => {
    if (step === 1 && competitorEvents.length === 0 && !isLoading) {
      setStep(0);
    }
  }, [step, isLoading, competitorEvents]);

  // when going back from keyword generation
  useEffect(() => {
    if (step === 3 && keywordEvents.length === 0 && !isLoading) {
      setStep(2);
    }
  }, [step, isLoading, keywordEvents]);

  const handleCompetitorResearch = async () => {
    if (!teamInfo?.currentTeam?.id || !appInfo.currentApp?.id) {
      return;
    }
    setIsLoading(true);
    setStep(1);
    setCompetitorEvents([]);
    try {
      analytics.capture('Competitor Research Started', {
        teamId: teamInfo?.currentTeam?.id,
        appId: appInfo.currentApp?.id,
        locale: locale,
      });
      await researchCompetitors(
        teamInfo.currentTeam.id,
        appInfo.currentApp.id,
        locale,
        shortDescription,
        appInfo.currentApp?.store || 'APPSTORE',
        appInfo.currentApp?.platform || 'IOS',
        (data: any) => {
          setCompetitorEvents((prevEvents) => [...prevEvents, data]);
          if (data.type === 'finalCompetitors') {
            setCompetitors(data.data);
            setIsLoading(false);
            setStep(2);
            analytics.capture('Competitors Found', {
              teamId: teamInfo?.currentTeam?.id,
              appId: appInfo.currentApp?.id,
              locale: locale,
            });
            toast.success(t('competitors-found'));
          }
        }
      );
    } catch (error) {
      toast.error(t('failed-to-research-competitors'));
      setCompetitorEvents((prevEvents) => [
        ...prevEvents,
        {
          type: 'error',
          message: t('failed-to-research-competitors'),
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleKeywordGeneration = async () => {
    if (!teamInfo?.currentTeam?.id || !appInfo.currentApp?.id) {
      return;
    }
    setIsLoading(true);
    setStep(3);
    setKeywordEvents([]);
    try {
      analytics.capture('Keyword Generation Started', {
        teamId: teamInfo?.currentTeam?.id,
        appId: appInfo.currentApp?.id,
        locale: locale,
      });
      await selectAndScoreKeywords(
        teamInfo.currentTeam.id,
        appInfo.currentApp.id,
        locale,
        shortDescription,
        appInfo.currentApp?.store,
        appInfo.currentApp?.platform,
        (data: any) => {
          setKeywordEvents((prevEvents) => [...prevEvents, data]);
          if (data.type === 'finalKeywords') {
            setKeywords(data.data);
            setIsLoading(false);
            setStep(4);
            analytics.capture('Keywords Generated', {
              teamId: teamInfo?.currentTeam?.id,
              appId: appInfo.currentApp?.id,
              locale: locale,
            });
            toast.success(t('keywords-generated'));
          }
        }
      );
    } catch (error) {
      toast.error(t('failed-to-generate-keywords'));
      setKeywordEvents((prevEvents) => [
        ...prevEvents,
        {
          type: 'error',
          message: t('failed-to-generate-keywords'),
        },
      ]);
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
    setStep(6);

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

  const handleCompetitorAdd = async (app: Partial<AppStoreApp>) => {
    if (!teamInfo?.currentTeam?.id || !appInfo.currentApp?.id) return;
    try {
      const newCompetitor = await addCompetitor(
        teamInfo.currentTeam.id,
        appInfo.currentApp.id,
        locale,
        app
      );
      setCompetitors((prev) => [newCompetitor, ...prev]);
    } catch (error) {
      toast.error(t('failed-to-add-competitor'));
    }
  };

  const handleCompetitorDelete = async (competitorId: string) => {
    if (!teamInfo?.currentTeam?.id || !appInfo.currentApp?.id) return;
    try {
      setCompetitors((prev) => prev.filter((c) => c.id !== competitorId));
      await deleteCompetitor(
        teamInfo.currentTeam.id,
        appInfo.currentApp.id,
        locale,
        competitorId
      );
      analytics.capture('Competitor Deleted', {
        teamId: teamInfo?.currentTeam?.id,
        appId: appInfo.currentApp?.id,
        locale: locale,
        competitorId: competitorId,
      });
    } catch (error) {
      toast.error(t('failed-to-delete-competitor'));
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
                t('setup-aso-process', { locale: getLocaleName(locale) })}
              {step === 1 &&
                t('researching-competitors', { locale: getLocaleName(locale) })}
              {step === 2 &&
                t('manage-competitors', { locale: getLocaleName(locale) })}
              {step === 3 &&
                t('generating-keywords', { locale: getLocaleName(locale) })}
              {step === 4 &&
                t('manage-keywords', { locale: getLocaleName(locale) })}
              {step === 5 &&
                t('select-fields-to-generate', {
                  locale: getLocaleName(locale),
                })}
              {step === 6 &&
                t('review-generated-contents', {
                  locale: getLocaleName(locale),
                })}
            </DialogTitle>
          </div>
        </DialogHeader>

        {isKeywordsLoading || isCompetitorsLoading ? (
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
                  onStart={handleCompetitorResearch}
                  isLoading={isLoading}
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <CompetitorResearchProgress
                  events={competitorEvents}
                  isLoading={isLoading}
                  onRetry={handleCompetitorResearch}
                />
                {!isLoading &&
                  !competitorEvents.some((event) => event.type === 'error') && (
                    <div className="flex justify-end">
                      <Button onClick={() => setStep(2)} disabled={isLoading}>
                        {t('confirm')}
                      </Button>
                    </div>
                  )}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-auto">
                  <CompetitorList
                    appId={appInfo.currentApp?.id || ''}
                    locale={locale}
                    competitors={competitors}
                    onAdd={handleCompetitorAdd}
                    onDelete={handleCompetitorDelete}
                    isLoading={isLoading}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 mt-auto">
                  <Button
                    variant="outline"
                    onClick={handleCompetitorResearch}
                    disabled={isLoading}
                  >
                    {t('research-again')}
                  </Button>
                  <Button
                    onClick={handleKeywordGeneration}
                    disabled={isLoading}
                  >
                    {t('generate-keywords')}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <KeywordGenerationProgress
                  events={keywordEvents}
                  isLoading={isLoading}
                  onRetry={handleKeywordGeneration}
                />
                {!isLoading &&
                  !keywordEvents.some((event) => event.type === 'error') && (
                    <div className="flex justify-end">
                      <Button onClick={() => setStep(4)} disabled={isLoading}>
                        {t('confirm-keywords-title')}
                      </Button>
                    </div>
                  )}
              </div>
            )}

            {step === 4 && (
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
                    onClick={handleKeywordGeneration}
                    disabled={isLoading}
                  >
                    {t('regenerate-keywords')}
                  </Button>
                  <Button onClick={() => setStep(5)} disabled={isLoading}>
                    {t('confirm-aso-keywords')}
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <SelectFields
                store={appInfo.currentApp?.store || 'APPSTORE'}
                currentValues={initialValues}
                onGenerate={handleContentOptimization}
              />
            )}

            {step === 6 && (
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
