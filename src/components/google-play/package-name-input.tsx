'use client';

import { useState } from 'react';
import { Plus, X, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

interface PackageNameInputProps {
  onPackageNamesSubmitted: (packageNames: string[]) => void;
  isLoading?: boolean;
}

export default function PackageNameInput({
  onPackageNamesSubmitted,
  isLoading = false,
}: PackageNameInputProps) {
  const [packageNames, setPackageNames] = useState<string[]>(['']);
  const t = useTranslations('import.google-play');

  const addPackageName = () => {
    setPackageNames([...packageNames, '']);
  };

  const removePackageName = (index: number) => {
    setPackageNames(packageNames.filter((_, i) => i !== index));
  };

  const updatePackageName = (index: number, value: string) => {
    const newPackageNames = [...packageNames];
    newPackageNames[index] = value;
    setPackageNames(newPackageNames);
  };

  const handleSubmit = () => {
    const validPackageNames = packageNames.filter(
      (name) => name.trim().length > 0
    );

    if (validPackageNames.length === 0) {
      toast.error(t('no-package-names'));
      return;
    }

    // Validate package name format (basic validation)
    const invalidNames = validPackageNames.filter(
      (name) => !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(name)
    );

    if (invalidNames.length > 0) {
      toast.error(t('invalid-package-names', { count: invalidNames.length }));
      return;
    }

    onPackageNamesSubmitted(validPackageNames);
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
            className="text-xl font-semibold flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            {t('enter-package-names')}
          </motion.h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t('package-names-description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {packageNames.map((packageName, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-2"
                >
                  <Input
                    type="text"
                    placeholder={t('package-name-placeholder')}
                    value={packageName}
                    onChange={(e) => updatePackageName(index, e.target.value)}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  {packageNames.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removePackageName(index)}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={addPackageName}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('add-another-package')}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? t('loading-apps') : t('load-apps')}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">{t('examples')}:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• com.google.android.apps.translate</li>
              <li>• com.whatsapp</li>
              <li>• com.spotify.music</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
