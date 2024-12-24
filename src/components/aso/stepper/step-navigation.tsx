import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface StepNavigationProps {
  currentStepIndex: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function StepNavigation({
  currentStepIndex,
  totalSteps,
  onPrevious,
  onNext,
}: StepNavigationProps) {
  const t = useTranslations('aso');
  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between items-center"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
    >
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStepIndex === 0}
      >
        {t('previous-step')}
      </Button>
      <div className="text-sm text-gray-500">
        {t('step-count', { index: currentStepIndex, total: totalSteps })}
      </div>
      {currentStepIndex !== totalSteps - 1 ? (
        <Button onClick={onNext}>{t('next-step')}</Button>
      ) : (
        <div className="text-sm text-gray-500">
          {t('when-done')}
          <br />
          {t('click-save-and-then-push')}
        </div>
      )}
    </motion.div>
  );
}
