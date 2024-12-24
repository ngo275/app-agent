import useSWR from 'swr';
import { useState } from 'react';
import { fetcher } from '../utils/fetcher';
import { useTeam } from '@/context/team';

export function useCheckExistingKey() {
  const teamInfo = useTeam();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, error, mutate, isLoading } = useSWR<{ hasKey: boolean }>(
    teamInfo?.currentTeam?.id
      ? `/api/teams/${teamInfo.currentTeam.id}/app-store-connect/key`
      : null,
    fetcher
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
  };

  return {
    hasKey: data?.hasKey,
    error,
    loading: isLoading,
    isRefreshing,
    refresh,
  };
}

export async function importAppsFromAppStoreConnect(
  teamId: string,
  appIds: string[]
) {
  const response = await fetch(
    `/api/teams/${teamId}/app-store-connect/import`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appIds }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}

export async function importAppsFromGooglePlay(
  teamId: string,
  appIds: string[]
) {
  const response = await fetch(`/api/teams/${teamId}/google-play/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}
