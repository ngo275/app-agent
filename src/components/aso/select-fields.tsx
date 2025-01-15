import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AsoContent, Store } from '@/types/aso';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface SelectFieldsProps {
  store: Store;
  currentValues: AsoContent;
  onGenerate: (
    selectedFields: {
      title: boolean;
      subtitle: boolean;
      description: boolean;
      keywords: boolean;
    },
    outline: string
  ) => Promise<any>;
}

export default function SelectFields({
  store,
  currentValues,
  onGenerate,
}: SelectFieldsProps) {
  const t = useTranslations('aso');
  const [selectedFields, setSelectedFields] = useState({
    title: true,
    subtitle: true,
    description: true,
    keywords: true,
  });
  const [outline, setOutline] = useState('');

  const handleGenerate = () => {
    onGenerate(selectedFields, outline);
  };

  const isAnyFieldSelected = Object.values(selectedFields).some(
    (value) => value
  );

  const getPreviewText = (text: string, maxLength: number = 100) => {
    if (!text) return '-';
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <motion.div
      className="space-y-4 max-h-[83vh] overflow-y-auto"
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-3">
        {Object.entries(selectedFields)
          .filter(([field]) => field !== 'keywords' || store === 'APPSTORE')
          .map(([field, checked]) => (
            <motion.div
              key={field}
              className="flex flex-col space-y-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedFields((prev) => ({ ...prev, [field]: !checked }));
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={field}
                    checked={checked}
                    onCheckedChange={(checked) =>
                      setSelectedFields((prev) => ({
                        ...prev,
                        [field]: !!checked,
                      }))
                    }
                    className="h-5 w-5"
                  />
                  <Label className="text-sm font-medium">
                    {t(`${field}-label`)}
                  </Label>
                </div>
              </div>

              <div className="pl-8">
                <p className="text-sm text-muted-foreground">
                  {t('current', {
                    current: getPreviewText(
                      currentValues[field as keyof typeof currentValues]
                    ),
                  })}
                </p>
              </div>
            </motion.div>
          ))}
      </div>

      {selectedFields.description && !currentValues.description && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Label htmlFor="outline">{t('description-outline')}</Label>
          <Textarea
            id="outline"
            value={outline}
            rows={2}
            onChange={(e) => setOutline(e.target.value)}
            placeholder="Enter outline for description..."
            className="min-h-[40px]"
          />
        </motion.div>
      )}

      <motion.div className="space-y-2">
        <div className="sticky bottom-0 pt-1 bg-background flex justify-end">
          <Button onClick={handleGenerate} disabled={!isAnyFieldSelected}>
            {t('generate-contents')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
