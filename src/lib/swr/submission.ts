import { useTeam } from '@/context/team';
import { fetcher } from '../utils/fetcher';
import useSWR from 'swr';
import { AppStoreConnectBuild } from '@/types/app-store';

export function useGetBuilds(appId: string, versionId: string) {
  const teamInfo = useTeam();
  const {
    data: builds,
    error,
    isLoading,
    mutate,
  } = useSWR<AppStoreConnectBuild[]>(
    teamInfo?.currentTeam?.id
      ? `/api/teams/${teamInfo.currentTeam.id}/apps/${appId}/versions/${versionId}/build`
      : null,
    fetcher
  );

  return {
    builds,
    error,
    isLoading,
    refreshBuilds: async () => {
      await mutate();
    },
  };
}

export async function selectBuild(
  teamId: string,
  appId: string,
  versionId: string,
  buildId: string
) {
  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/versions/${versionId}/build`,
    {
      method: 'POST',
      body: JSON.stringify({ buildId }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to select build');
  }

  return response.json();
}

export async function submitAppVersionForReview(
  teamId: string,
  appId: string,
  versionId: string
) {
  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/versions/${versionId}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({ versionId }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to submit app version for review');
  }

  return response.json();
}
