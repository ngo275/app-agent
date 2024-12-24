import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface StartResearchProps {
  shortDescription: string;
  setShortDescription: (shortDescription: string) => void;
  onStart: () => void;
  isLoading: boolean;
}

export default function StartResearch({
  shortDescription,
  setShortDescription,
  onStart,
  isLoading,
}: StartResearchProps) {
  const t = useTranslations('aso');
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="space-y-2">
        <Label htmlFor="note">{t('brief-app-description')}</Label>
        <Textarea
          id="shortDescription"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder={t('brief-app-description-placeholder')}
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground mt-2">
          {t('brief-app-description-help')}
          <br />
          {t('brief-app-description-help-2')}
        </p>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={onStart}
          disabled={!shortDescription.trim() || isLoading}
        >
          {isLoading
            ? t('generating-keywords-button')
            : t('generate-keywords-button')}
        </Button>
      </div>
    </motion.div>
  );
}
