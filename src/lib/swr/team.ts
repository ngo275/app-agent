import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { Team, TeamDetail } from '@/types/user';
import { fetcher } from '@/lib/utils/fetcher';
import { useTeam } from '@/context/team';

export function useGetTeam() {
  const teamInfo = useTeam();

  const {
    data: team,
    error,
    isLoading,
  } = useSWR<TeamDetail>(
    teamInfo?.currentTeam && `/api/teams/${teamInfo.currentTeam.id}`,
    fetcher,
    {
      dedupingInterval: 20000,
    }
  );

  return {
    team,
    loading: isLoading,
    error,
  };
}

export function useTeams() {
  const { data: session } = useSession();

  const {
    data: teams,
    isValidating,
    error,
    isLoading,
  } = useSWR<Team[]>(session && '/api/teams', fetcher, {
    dedupingInterval: 20000,
  });

  return {
    teams,
    loading: isLoading || teams === undefined,
    isValidating,
    error,
  };
}
