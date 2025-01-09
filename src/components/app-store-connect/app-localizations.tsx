'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AppLocalizationView from './app-localization';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdLanguage,
  MdRocket,
  MdTrendingUp,
  MdArrowForward,
  MdCheck,
  MdAdd,
  MdAutoFixHigh,
  MdInfoOutline,
} from 'react-icons/md';
import { addNewLocale, localizeWhatsNew } from '@/lib/swr/version';
import { useApp } from '@/context/app';
import { useTeam } from '@/context/team';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAllStoreLocales,
  getLocaleName,
  LocaleCode,
} from '@/lib/utils/locale';
import { toast } from 'react-hot-toast';
import { ASOModal } from '@/components/aso/aso-modal';
import { AsoContent, LocalizationEditMode } from '@/types/aso';
import { AppLocalization } from '@/types/aso';
import { steps } from '@/components/aso/stepper/steps';
import { StepIndicator } from '@/components/aso/stepper/step-indicator';
import { InitialStep } from '@/components/aso/stepper/initial-step';
import { StepNavigation } from '@/components/aso/stepper/step-navigation';
import { Textarea } from '@/components/ui/textarea';
import LoadingOverlay from '@/components/common/loading';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AppLocalizationsProps {
  localizations: {
    [key: string]: { public?: AppLocalization; draft?: AppLocalization };
  };
  saveLocalLocalizations: () => Promise<void>;
  updateLocalLocalizations: (
    locale: string,
    updatedData: Partial<AppLocalization>
  ) => void;
  refresh: () => Promise<void>;
}

export default function AppLocalizations({
  localizations,
  saveLocalLocalizations,
  updateLocalLocalizations,
  refresh,
}: AppLocalizationsProps) {
  const t = useTranslations('dashboard.app-store-connect.localization');
  const tAso = useTranslations('aso');
  const appInfo = useApp();
  const teamInfo = useTeam();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [globalWhatsNew, setGlobalWhatsNew] = useState('');
  const [addingLocale, setAddingLocale] = useState(false);
  const [isLocalizing, setIsLocalizing] = useState(false);
  const currentStep = steps[currentStepIndex];
  const [isLocaleDialogOpen, setIsLocaleDialogOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<string>('');
  const [showASOModal, setShowASOModal] = useState(false);
  const [selectedLocaleForASO, setSelectedLocaleForASO] =
    useState<LocaleCode | null>(null);
  const [expandedLocale, setExpandedLocale] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStepIndex(0);
  }, [appInfo?.currentApp?.id]);

  const handleApplyGlobalWhatsNew = async () => {
    try {
      setIsLocalizing(true);
      const result: { [key: string]: string } = await localizeWhatsNew(
        teamInfo?.currentTeam?.id || '',
        appInfo?.currentApp?.id || '',
        globalWhatsNew,
        Object.values(localizations)
          .map((loc) => loc.public || loc.draft)
          .filter(Boolean) as AppLocalization[],
        Object.values(localizations)?.[0]?.draft?.appVersion?.version || '',
        Object.values(localizations)?.[0]?.draft?.appVersion?.platform || ''
      );

      if (result) {
        Object.keys(localizations).forEach((locale) => {
          updateLocalLocalizations(locale, {
            whatsNew: result[locale] || globalWhatsNew,
          });
        });
      }
    } catch (err) {
      console.error("Failed to localize what's new:", err);
      toast.error(t('failed-to-localize-whats-new'));
    } finally {
      setIsLocalizing(false);
    }
  };

  const handleAddLocale = async (locale: string) => {
    try {
      setAddingLocale(true);

      // First, save current localizations
      await saveLocalLocalizations();

      // Then add the new locale
      await addNewLocale(
        teamInfo?.currentTeam?.id || '',
        appInfo?.currentApp?.id || '',
        locale as LocaleCode
      );
      await refresh();
    } catch (error) {
      toast.error(t('failed-to-add-new-locale'));
    } finally {
      setAddingLocale(false);
    }
  };

  const allLocales = useMemo(() => {
    return getAllStoreLocales().filter(
      (locale) => !Object.keys(localizations).includes(locale)
    );
  }, [localizations]);

  const getLocaleMetadata = useCallback(
    (locale: string) => {
      const localization =
        localizations[locale]?.draft || localizations[locale]?.public;
      return {
        title: localization?.title || '',
        subtitle: localization?.subtitle || '',
        description: localization?.description || '',
        keywords: localization?.keywords || '',
      };
    },
    [localizations]
  );

  const handleASOUpdate = (locale: string, updatedMetadata: AsoContent) => {
    updateLocalLocalizations(locale, updatedMetadata);
    setShowASOModal(false);
    setSelectedLocaleForASO(null);
    setExpandedLocale(locale);
  };

  const hasLimitedLocales = useMemo(() => {
    return Object.keys(localizations).length < 10;
  }, [localizations]);

  if (currentStepIndex === 0) {
    return (
      <InitialStep
        steps={steps}
        currentStepIndex={currentStepIndex}
        setCurrentStepIndex={setCurrentStepIndex}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {isLocalizing && <LoadingOverlay />}
      {addingLocale && <LoadingOverlay />}

      <StepIndicator
        steps={steps}
        currentStepIndex={currentStepIndex}
        setCurrentStepIndex={setCurrentStepIndex}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {tAso(currentStep.title)}
        </h2>
        {/* <button
          onClick={() => setCurrentStepIndex(0)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Start Over
        </button> */}
      </div>

      {currentStep.mode === LocalizationEditMode.QUICK_RELEASE && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-lg font-medium">{t('release-notes')}</h3>
          <div className="space-y-2">
            <Textarea
              value={globalWhatsNew}
              onChange={(e) => setGlobalWhatsNew(e.target.value)}
              rows={4}
              placeholder={t('release-notes-placeholder')}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleApplyGlobalWhatsNew}
                disabled={isLocalizing}
              >
                {t('apply-to-all-languages')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {hasLimitedLocales && (
          <Alert className="bg-blue-50 border-blue-200">
            <MdInfoOutline className="h-5 w-5 text-blue-500" />
            <AlertTitle className="text-blue-700">
              {t('expand-global-reach')}
            </AlertTitle>
            <AlertDescription className="text-blue-600">
              {t('add-more-locales-message')}
            </AlertDescription>
          </Alert>
        )}

        {Object.entries(localizations).map(
          ([locale, data]) =>
            data.draft && (
              <div key={locale} className="space-y-2">
                <AppLocalizationView
                  localization={data.draft}
                  originalData={data.public}
                  onUpdate={(updatedData) =>
                    updateLocalLocalizations(locale, updatedData)
                  }
                  mode={currentStep.mode!}
                  defaultExpanded={
                    // currentStep.mode !== LocalizationEditMode.IMPROVE_ASO ||
                    expandedLocale === locale
                  }
                  onASOClick={
                    currentStep.mode === LocalizationEditMode.IMPROVE_ASO
                      ? () => {
                          setSelectedLocaleForASO(locale as LocaleCode);
                          setShowASOModal(true);
                        }
                      : undefined
                  }
                />
              </div>
            )
        )}

        <Dialog open={isLocaleDialogOpen} onOpenChange={setIsLocaleDialogOpen}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setIsLocaleDialogOpen(true)}
              variant="outline"
              className="w-full p-8 rounded-xl border-2 border-dashed hover:border-blue-500 hover:text-blue-500"
            >
              <MdAdd className="w-5 h-5 mr-2" />
              {t('add-new-locale')}
            </Button>
          </motion.div>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('add-new-locale')}</DialogTitle>
              <DialogDescription>
                {t('add-new-locale-description')}
                <div className="text-sm text-muted-foreground mt-2">
                  <p>{t('screenshots-note')}</p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="locale" className="text-right">
                  {t('locale')}
                </Label>
                <Select
                  value={selectedLocale}
                  onValueChange={setSelectedLocale}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('locale-placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {allLocales.map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {getLocaleName(locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  if (selectedLocale) {
                    handleAddLocale(selectedLocale);
                    setIsLocaleDialogOpen(false);
                    setSelectedLocale('');
                  }
                }}
                disabled={!selectedLocale}
              >
                {t('add-new-locale-button')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedLocaleForASO && (
        <ASOModal
          isOpen={showASOModal}
          onClose={() => {
            setShowASOModal(false);
            setSelectedLocaleForASO(null);
          }}
          initialValues={getLocaleMetadata(selectedLocaleForASO)}
          onSave={(values) => handleASOUpdate(selectedLocaleForASO, values)}
          locale={selectedLocaleForASO}
        />
      )}

      <StepNavigation
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        onPrevious={() => setCurrentStepIndex((prev) => prev - 1)}
        onNext={() => setCurrentStepIndex((prev) => prev + 1)}
      />
    </div>
  );
}
