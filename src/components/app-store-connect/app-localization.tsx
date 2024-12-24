'use client';

import { AppLocalization, LocalizationEditMode } from '@/types/aso';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdExpandMore, MdSettings, MdAdd, MdAutoFixHigh } from 'react-icons/md';
import { getLocaleName, LocaleCode } from '@/lib/utils/locale';
import LocalizationField from '@/components/common/localization-field';
import { FIELD_LIMITS } from '@/types/app-store';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface AppLocalizationProps {
  // Current localization data in draft
  localization: AppLocalization;
  // Current localization data in public
  originalData?: AppLocalization;
  // Function to update the localization
  onUpdate: (updatedData: Partial<AppLocalization>) => void;
  // Mode of the localization
  mode: LocalizationEditMode;
  defaultExpanded?: boolean;
  onASOClick?: () => void;
}

export default function AppLocalizationView({
  localization,
  originalData,
  onUpdate,
  mode,
  defaultExpanded = true,
  onASOClick,
}: AppLocalizationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const t = useTranslations('dashboard.app-store-connect.localization');

  useEffect(() => {
    // FIXME: this doesn't work
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [mode]);

  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const handleChange = (field: keyof AppLocalization, value: string) => {
    onUpdate({ [field]: value });
  };

  const hasFieldChanged = (field: keyof AppLocalization) => {
    return originalData && localization[field] !== originalData[field];
  };

  const renderQuickReleaseMode = () => (
    <div className="space-y-4">
      <LocalizationField
        label={t('whats-new')}
        value={localization.whatsNew}
        onChange={(value) => handleChange('whatsNew', value)}
        multiline
        characterLimit={FIELD_LIMITS.whatsNew}
        hasChanged={hasFieldChanged('whatsNew')}
      />
    </div>
  );

  const renderASOMode = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocalizationField
          label={t('title')}
          value={localization.title}
          onChange={(value) => handleChange('title', value)}
          characterLimit={FIELD_LIMITS.title}
          hasChanged={hasFieldChanged('title')}
          originalValue={originalData?.title}
        />
        <LocalizationField
          label={t('subtitle')}
          value={localization.subtitle}
          onChange={(value) => handleChange('subtitle', value)}
          characterLimit={FIELD_LIMITS.subtitle}
          hasChanged={hasFieldChanged('subtitle')}
          originalValue={originalData?.subtitle}
        />
      </div>

      <LocalizationField
        label={t('keywords')}
        value={localization.keywords}
        onChange={(value) => handleChange('keywords', value)}
        characterLimit={FIELD_LIMITS.keywords}
        hasChanged={hasFieldChanged('keywords')}
        originalValue={originalData?.keywords}
      />

      <LocalizationField
        label={t('description')}
        value={localization.description}
        onChange={(value) => handleChange('description', value)}
        multiline
        characterLimit={FIELD_LIMITS.description}
        hasChanged={hasFieldChanged('description')}
      />

      <LocalizationField
        label={t('promotional-text')}
        value={localization.promotionalText}
        onChange={(value) => handleChange('promotionalText', value)}
        multiline
        characterLimit={FIELD_LIMITS.promotionalText}
        hasChanged={hasFieldChanged('promotionalText')}
      />
    </div>
  );

  const renderAdvancedFields = () => (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="space-y-4 pt-4"
    >
      <h4 className="text-sm font-medium text-gray-500">
        {t('advanced-settings')}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocalizationField
          label={t('privacy-policy-url')}
          value={localization.privacyPolicyUrl}
          onChange={(value) => handleChange('privacyPolicyUrl', value)}
          hasChanged={hasFieldChanged('privacyPolicyUrl')}
        />
        <LocalizationField
          label={t('privacy-choices-url')}
          value={localization.privacyChoicesUrl}
          onChange={(value) => handleChange('privacyChoicesUrl', value)}
          hasChanged={hasFieldChanged('privacyChoicesUrl')}
        />
      </div>
      <LocalizationField
        label={t('privacy-policy-text')}
        value={localization.privacyPolicyText}
        onChange={(value) => handleChange('privacyPolicyText', value)}
        multiline
        hasChanged={hasFieldChanged('privacyPolicyText')}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocalizationField
          label={t('marketing-url')}
          value={localization.marketingUrl}
          onChange={(value) => handleChange('marketingUrl', value)}
          hasChanged={hasFieldChanged('marketingUrl')}
        />
        <LocalizationField
          label={t('support-url')}
          value={localization.supportUrl}
          onChange={(value) => handleChange('supportUrl', value)}
          hasChanged={hasFieldChanged('supportUrl')}
        />
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-lg font-medium text-gray-900">
          {getLocaleName(localization.locale as LocaleCode)}
        </h3>
        <div className="flex items-center space-x-3">
          {mode === LocalizationEditMode.QUICK_RELEASE && (
            <span className="text-sm text-gray-500">
              {localization.whatsNew
                ? `${localization.whatsNew.slice(0, 50)}${localization.whatsNew.length > 50 ? '...' : ''}`
                : t('no-release-notes-yet')}
            </span>
          )}
          {onASOClick && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onASOClick();
              }}
              variant="outline"
              size="sm"
              className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <MdAutoFixHigh className="w-4 h-4" />
              {t('aso-with-ai')}
            </Button>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <MdExpandMore className="w-6 h-6 text-gray-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6 border-t border-gray-100 space-y-4">
              {mode === LocalizationEditMode.QUICK_RELEASE
                ? renderQuickReleaseMode()
                : renderASOMode()}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <MdSettings
                    className={`w-4 h-4 ${showAdvanced ? 'text-blue-500' : ''}`}
                  />
                  <span>{t('advanced-settings')}</span>
                </button>
              </div>

              <AnimatePresence>
                {showAdvanced && renderAdvancedFields()}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
