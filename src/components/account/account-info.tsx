import { useSession, signOut } from 'next-auth/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FiUser, FiMail, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setLocale } from '@/lib/swr/account';
import { SUPPORTED_LOCALES, USER_LOCALE_COOKIE_NAME } from '@/lib/utils/locale';
import { getCookie } from 'cookies-next';

export function AccountInfo() {
  const t = useTranslations('account');
  const tCommon = useTranslations('common');
  const { data: session } = useSession();
  const user = session?.user;

  const displayName = user?.name || 'Guest User';
  const avatarFallbackText = (user?.name?.[0] || 'G').toUpperCase();

  const currentLocale = getCookie(USER_LOCALE_COOKIE_NAME) || 'en';

  const handleLocaleChange = async (newLocale: string) => {
    await setLocale(newLocale);
    // Refresh the page
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiUser className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{t('title')}</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="flex items-center space-x-2"
          >
            <FiLogOut className="h-4 w-4" />
            <span>{t('sign-out')}</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user?.image || '/default-avatar.png'}
                alt={displayName}
              />
              <AvatarFallback>{avatarFallbackText}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FiUser className="text-muted-foreground" />
                <span>{displayName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiMail className="text-muted-foreground" />
                <span>{user?.email || t('no-email-provided')}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('language-preference')}
            </label>
            <Select
              onValueChange={handleLocaleChange}
              defaultValue={currentLocale as string}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('select-language')} />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LOCALES.map((locale: string) => (
                  <SelectItem key={locale} value={locale}>
                    {tCommon('locales.' + locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
