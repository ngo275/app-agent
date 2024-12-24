'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  validateKeyId,
  validateIssuerId,
  validateP8File,
} from '@/lib/utils/validation';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LoadingOverlay from '../common/loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';

interface KeyUploadProps {
  onKeyUploaded: () => void;
  teamId?: string;
}

export default function KeyUpload({ onKeyUploaded, teamId }: KeyUploadProps) {
  const [p8File, setP8File] = useState<File | null>(null);
  const [keyId, setKeyId] = useState('');
  const [issuerId, setIssuerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyIdError, setKeyIdError] = useState('');
  const [issuerIdError, setIssuerIdError] = useState('');
  const [p8Error, setP8Error] = useState('');
  const t = useTranslations('dashboard.app-store-connect.localization');

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const validation = validateP8File(file);
    if (validation.isValid) {
      setP8File(file);
      setP8Error('');
    } else {
      setP8Error(t(validation.error));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-pem-file': ['.p8'],
    },
    maxFiles: 1,
  });

  const uploadKey = async () => {
    // Validate inputs
    if (!teamId) {
      setKeyIdError(t('team-id-required'));
      return;
    }

    const keyIdValidation = validateKeyId(keyId);
    const issuerIdValidation = validateIssuerId(issuerId);
    const p8Validation = validateP8File(p8File);

    if (keyIdValidation.error) {
      setKeyIdError(t(keyIdValidation.error));
    }
    if (issuerIdValidation.error) {
      setIssuerIdError(t(issuerIdValidation.error));
    }
    if (p8Validation.error) {
      setP8Error(t(p8Validation.error));
    }

    if (
      !keyIdValidation.isValid ||
      !issuerIdValidation.isValid ||
      !p8Validation.isValid
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('keyId', keyId);
      formData.append('issuerId', issuerId);
      formData.append('p8File', p8File as File);
      if (teamId) {
        formData.append('teamId', teamId);
      }

      const response = await fetch(
        `/api/teams/${teamId}/app-store-connect/key`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('failed-to-upload-key'));
      }

      onKeyUploaded();
    } catch (error) {
      console.error('Error uploading key:', error);
      setP8Error(
        error instanceof Error ? error.message : t('failed-to-upload-key')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {isLoading && <LoadingOverlay />}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-semibold"
          >
            {t('upload-app-store-connect-api-key')}
          </motion.h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground"
              >
                {t('how-to-generate-an-api-key')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('how-to-generate-an-api-key')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>{t('how-to-generate-an-api-key-description')}</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>{t('log-in-to-app-store-connect')}</li>
                  <li>{t('select-users-and-access')}</li>
                  <li>{t('make-sure-the-team-keys-tab-is-selected')}</li>
                  <li>{t('click-generate-api-key-or-the-add-button')}</li>
                  <li>{t('enter-a-name-for-the-key')}</li>
                  <li>{t('select-the-key-permissions')}</li>
                  <li>{t('click-generate')}</li>
                </ol>
                <p className="text-sm text-muted-foreground">
                  {t('copy-the-key-id-and-key-secret')}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key ID and Issuer ID Inputs Container */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Key ID Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <Label htmlFor="keyId">{t('key-id')}</Label>
              <Input
                type="text"
                id="keyId"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                className={keyIdError ? 'border-destructive' : ''}
                placeholder={t('enter-your-key-id')}
              />
              {keyIdError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-sm text-destructive"
                >
                  {keyIdError}
                </motion.p>
              )}
            </motion.div>

            {/* Issuer ID Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <Label htmlFor="issuerId">{t('issuer-id')}</Label>
              <Input
                type="text"
                id="issuerId"
                value={issuerId}
                onChange={(e) => setIssuerId(e.target.value)}
                className={issuerIdError ? 'border-destructive' : ''}
                placeholder={t('enter-your-issuer-id')}
              />
              {issuerIdError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-sm text-destructive"
                >
                  {issuerIdError}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* P8 File Dropzone */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <Label>{t('private-key-p8')}</Label>
            {/* @ts-ignore */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              {...getRootProps()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted'}
                ${p8Error ? 'border-destructive' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 14v20c0 4.418 3.582 8 8 8h16c4.418 0 8-3.582 8-8V14M8 14c0-4.418 3.582-8 8-8h16c4.418 0 8 3.582 8 8M8 14h32"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  {p8File
                    ? p8File.name
                    : isDragActive
                      ? t('drop-the-file-here')
                      : t('drag-and-drop-your-p8-file-here')}
                </p>
              </div>
            </motion.div>
            {p8Error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-sm text-destructive"
              >
                {p8Error}
              </motion.p>
            )}
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button onClick={uploadKey} disabled={isLoading} className="w-full">
              {isLoading ? t('uploading') : t('upload-key')}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
