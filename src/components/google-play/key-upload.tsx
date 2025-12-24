'use client';

import { useState, useRef } from 'react';
import { Upload, FileJson } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface KeyUploadProps {
  onKeyUploaded: () => void;
  teamId?: string;
}

export default function GooglePlayKeyUpload({
  onKeyUploaded,
  teamId,
}: KeyUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('import.google-play');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        toast.error(t('invalid-file-type'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !teamId) {
      toast.error(t('no-file-selected'));
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('jsonFile', selectedFile);

      const response = await fetch(`/api/teams/${teamId}/google-play/key`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('upload-failed'));
      }

      toast.success(t('key-uploaded-successfully'));
      onKeyUploaded();
    } catch (error) {
      console.error('Error uploading key:', error);
      toast.error(error instanceof Error ? error.message : t('upload-failed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      setSelectedFile(file);
    } else {
      toast.error(t('invalid-file-type'));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-semibold"
          >
            {t('upload-service-account-key')}
          </motion.h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t('upload-description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <h3 className="font-medium">{t('step-1-title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('step-1-description')}
              </p>
              <a
                href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-block"
              >
                {t('open-google-cloud-console')} →
              </a>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">{t('step-2-title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('step-2-description')}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">{t('step-3-title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('step-3-description')}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">{t('step-4-title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('step-4-description')}
              </p>
              <a
                href="https://play.google.com/console/developers/api-access"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-block"
              >
                {t('open-play-console')} →
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-4">
                <FileJson className="w-12 h-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    {t('change-file')}
                  </Button>
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? t('uploading') : t('upload')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">{t('drag-and-drop-or-click')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('json-file-only')}
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  {t('select-file')}
                </Button>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
