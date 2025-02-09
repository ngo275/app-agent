'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteAccount } from '@/lib/swr/account';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useTeam } from '@/context/team';

export function DeleteAccount() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations('account');
  const teamInfo = useTeam();

  // Check if user has active paid subscription
  const hasActivePaidSubscription = useMemo(() => {
    return (
      teamInfo?.currentTeam?.plan !== 'free' &&
      teamInfo?.currentTeam?.canceledAt === null
    );
  }, [teamInfo?.currentTeam?.plan, teamInfo?.currentTeam?.canceledAt]);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      toast.success(t('delete-account-success'));
      router.push('/');
    } catch (error) {
      toast.error(t('delete-account-error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            {t('delete-account')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasActivePaidSubscription ? (
            <p className="text-sm text-muted-foreground mb-4">
              {t('delete-account-subscription-active')}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {t('delete-account-description')}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div className="flex justify-end">
                    <Button variant="destructive">{t('delete-account')}</Button>
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('delete-account-are-you-sure')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('delete-account-warning')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? t('deleting') : t('delete-account')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
