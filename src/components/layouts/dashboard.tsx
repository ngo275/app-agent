'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { FaChevronDown, FaUserCircle, FaCog } from 'react-icons/fa';
import { useApp } from '@/context/app';
import { AppStoreConnectAgreementError } from '../app-store-connect/app-store-agreement-error';
import { AppErrorType } from '@/types/errors';
import { useVersionCheck } from '@/lib/swr/version';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import { useTranslations } from 'next-intl';
import { useTeam } from '@/context/team';
import { FREE_TRIAL_DAYS, NEXT_PUBLIC_FREE_PLAN_ENABLED } from '@/lib/config';
import { differenceInDays } from 'date-fns';

const getTrialDaysRemaining = (createdAt: Date) => {
  const trialEndDate = new Date(
    createdAt.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000
  );
  return Math.max(0, differenceInDays(trialEndDate, new Date()));
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('layout');
  const { data: session } = useSession();
  const { apps, currentApp, isLoading, setCurrentApp } = useApp();
  const teamInfo = useTeam();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    versionStatus,
    loading: versionStatusLoading,
    error: versionStatusError,
    isRefreshing: versionStatusIsRefreshing,
    refresh: versionStatusRefresh,
  } = useVersionCheck(currentApp?.id || '');

  const showTrialBanner =
    NEXT_PUBLIC_FREE_PLAN_ENABLED !== 'true' && teamInfo?.isFreeTrial;

  const trialDaysRemaining =
    showTrialBanner && teamInfo?.currentTeam?.createdAt
      ? getTrialDaysRemaining(new Date(teamInfo.currentTeam.createdAt))
      : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // @ts-ignore
      if (isDropdownOpen && !event.target?.closest('.relative')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Menu Bar */}
        <header className="border-b bg-newColor">
          <div className="max-w-7xl mx-auto py-4 px-6 flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center gap-1">
              <Image
                src={logo}
                alt={t('title')}
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-semibold hover:opacity-80 cursor-pointer">
                {t('title')}
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              {/* Replace app dropdown with shadcn DropdownMenu */}
              {!isLoading && apps.length > 0 && (
                <DropdownMenu
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="space-x-2">
                      <span>{currentApp?.title}</span>
                      <FaChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {apps.map((app) => (
                      <DropdownMenuItem
                        key={app.id}
                        onClick={() => {
                          setCurrentApp(app);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(currentApp?.id === app.id && 'bg-accent')}
                      >
                        {app.title}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/import"
                        className="flex items-center space-x-2"
                      >
                        <FaCog className="h-4 w-4" />
                        <span>{t('manage-apps')}</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* <Button variant="ghost" size="icon">
                <FaBell className="h-5 w-5" />
              </Button> */}

              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/account">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={t('user-avatar')}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <FaUserCircle className="h-5 w-5" />
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Add trial banner here */}
        {showTrialBanner && trialDaysRemaining > 0 && (
          <div className="bg-primary px-6 py-2 text-center text-white">
            <p className="text-sm">
              {trialDaysRemaining === 1
                ? t('trial-day-remaining', { days: 1 })
                : t('trial-days-remaining', { days: trialDaysRemaining })}
              <Link
                href="/dashboard/plan"
                className="ml-2 underline hover:text-white/90"
              >
                {t('upgrade-now')}
              </Link>
            </p>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {versionStatusError &&
            versionStatusError.code ===
              AppErrorType.APP_STORE_CONNECT_AGREEMENT ? (
              <AppStoreConnectAgreementError onRefresh={versionStatusRefresh} />
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const NavItem = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <li>
      <Link
        href={href}
        className={cn(
          'flex items-center space-x-2 px-6 py-3 transition-colors',
          isActive
            ? 'bg-primary-foreground/10 text-primary-foreground'
            : 'text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground'
        )}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
};
