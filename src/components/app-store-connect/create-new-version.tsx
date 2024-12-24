import { motion } from 'framer-motion';
import { MdAddCircleOutline } from 'react-icons/md';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface CreateNewVersionProps {
  createNewVersion: (version: string) => void;
  currentVersion: string;
}

export function CreateNewVersion({
  createNewVersion,
  currentVersion,
}: CreateNewVersionProps) {
  const t = useTranslations('dashboard.app-store-connect.localization');
  // Initialize with a suggested next version based on current version
  const suggestedVersion = currentVersion.replace(/(\d+)$/, (match) => {
    return String(Number(match) + 1);
  });

  const [newVersion, setNewVersion] = useState(suggestedVersion);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVersion.trim()) {
      createNewVersion(newVersion.trim());
    }
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVersion(e.target.value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Card className="max-w-md mx-auto">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <Badge variant="secondary">
              {t('current-version', { version: currentVersion })}
            </Badge>
          </div>
          <CardTitle>{t('create-new-version')}</CardTitle>
          <CardDescription>
            {t('create-new-version-description')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div whileTap={{ scale: 0.995 }}>
              <Input
                type="text"
                value={newVersion}
                onChange={handleVersionChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t('new-version-number')}
                required
              />
            </motion.div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                disabled={!newVersion.trim()}
                className="w-full"
              >
                <span>{t('create-version')}</span>
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 ml-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </motion.svg>
              </Button>
            </motion.div>
          </form>

          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MdAddCircleOutline className="w-4 h-4" />
              <span>{t('version-will-be-created-as-a-draft')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
