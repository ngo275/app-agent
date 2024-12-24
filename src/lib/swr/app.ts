import { useState } from 'react';
import { useTeam } from '@/context/team';
import {
  AppStoreConnectAppData,
  AppStoreConnectAppInfoLocalization,
} from '@/types/app-store';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';
import { App, AppLocalization, AppVersion } from '@/types/aso';
import { GooglePlayApp } from '@/types/google-play';

export function useGetAppsFromAppStoreConnect() {
  const teamInfo = useTeam();
  const {
    data: apps,
    error,
    mutate,
    isLoading,
  } = useSWR<AppStoreConnectAppData[]>(
    teamInfo?.currentTeam?.id
      ? `/api/teams/${teamInfo.currentTeam.id}/app-store-connect`
      : null,
    fetcher
  );

  const refreshApps = async () => {
    await mutate();
  };

  return {
    apps,
    loading: isLoading,
    error,
    refreshApps,
  };
}

export function useGetAppsFromGooglePlay() {
  const teamInfo = useTeam();
  const {
    data: apps,
    error,
    isLoading,
  } = useSWR<GooglePlayApp[]>(
    teamInfo?.currentTeam?.id
      ? `/api/teams/${teamInfo.currentTeam.id}/google-play`
      : null,
    fetcher
  );

  return {
    apps,
    loading: isLoading,
    error,
  };
}

export function useGetApps() {
  const teamInfo = useTeam();

  const {
    data: apps,
    error,
    mutate,
    isLoading,
  } = useSWR<App[]>(
    teamInfo?.currentTeam?.id
      ? `/api/teams/${teamInfo.currentTeam.id}/apps`
      : null,
    fetcher
  );

  return {
    apps,
    loading: isLoading,
    error,
    refreshApps: async () => {
      await mutate();
    },
  };
}

export function useGetAppLocalizations(appId: string) {
  const teamInfo = useTeam();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    data: localizations,
    error,
    mutate,
    isLoading,
  } = useSWR<{
    [key: string]: { public?: AppLocalization; draft?: AppLocalization };
  }>(
    teamInfo?.currentTeam?.id && appId
      ? `/api/teams/${teamInfo.currentTeam.id}/apps/${appId}/localizations`
      : null,
    fetcher
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
  };

  return {
    localizations,
    loading: isLoading,
    error,
    isRefreshing,
    refresh,
  };
}

export async function checkShortDescription(teamId: string, appId: string) {
  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/short-description`,
    {
      method: 'POST',
    }
  );
  return response.json();
}
