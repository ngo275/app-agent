import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import CharacterCount from '@/components/common/character-count';
import ASOModalSkeleton from '../skeleton/aso-modal';
import { FIELD_LIMITS } from '@/types/app-store';
import { useState, useEffect } from 'react';
import { AsoContent, Store } from '@/types/aso';
import { useTranslations } from 'next-intl';

interface GenerateContentsProps {
  isGenerating: boolean;
  store: Store;
  generatedContent: AsoContent;
  onRegenerate: (
    selectedFields: {
      title: boolean;
      subtitle: boolean;
      description: boolean;
      keywords: boolean;
    },
    feedback: string,
    previousResults: AsoContent
  ) => Promise<any>;
  onSave: (values: AsoContent) => void;
  onClose: () => void;
}

export default function GenerateContentsView({
  isGenerating,
  store,
  generatedContent,
  onRegenerate,
  onSave,
  onClose,
}: GenerateContentsProps) {
  const t = useTranslations('aso');
  const [localContent, setLocalContent] =
    useState<AsoContent>(generatedContent);
  const [feedback, setFeedback] = useState('');
  const [selectedFields, setSelectedFields] = useState({
    title: true,
    subtitle: true,
    description: true,
    keywords: store === 'APPSTORE',
  });

  useEffect(() => {
    setLocalContent(generatedContent);
  }, [generatedContent]);

  const handleRegenerate = async () => {
    const newResults = await onRegenerate(
      selectedFields,
      feedback,
      generatedContent
    );
    if (newResults) {
      setFeedback('');
    }
  };

  const handleConfirm = () => {
    onSave(localContent);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6 overflow-y-auto pr-4 -mr-4">
      {isGenerating ? (
        <ASOModalSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {Object.entries(localContent).map(
            ([field, content]) =>
              selectedFields[field as keyof typeof selectedFields] && (
                <motion.div key={field} variants={itemVariants}>
                  <Card className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={field} className="text-sm font-medium">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </Label>
                      <CharacterCount
                        current={content.length}
                        limit={FIELD_LIMITS[field as keyof typeof FIELD_LIMITS]}
                      />
                    </div>
                    {field === 'description' ? (
                      <Textarea
                        id={field}
                        value={content}
                        rows={6}
                        onChange={(e) => {
                          setLocalContent((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }));
                        }}
                        className="resize-none"
                        maxLength={
                          FIELD_LIMITS[field as keyof typeof FIELD_LIMITS]
                        }
                      />
                    ) : (
                      <Input
                        id={field}
                        value={content}
                        onChange={(e) => {
                          setLocalContent((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }));
                        }}
                        maxLength={
                          FIELD_LIMITS[field as keyof typeof FIELD_LIMITS]
                        }
                      />
                    )}
                  </Card>
                </motion.div>
              )
          )}

          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="feedback" className="text-sm font-medium">
                {t('feedback-for-regeneration')}
              </Label>
              <CharacterCount current={feedback.length} limit={200} />
            </div>
            <Input
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('feedback-for-regeneration-placeholder')}
              className="w-full"
              maxLength={200}
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="sticky bottom-0 pt-4 bg-background flex justify-end gap-2"
          >
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={!feedback.trim()}
            >
              {t('regenerate')}
            </Button>
            <Button onClick={handleConfirm}>{t('confirm')}</Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
