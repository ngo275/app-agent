'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTeams } from '@/lib/swr/team';
import { Team } from '@/types/user';
import { AppErrorType } from '@/types/errors';

interface TeamContextProps {
  children: React.ReactNode;
}

export type TeamContextType = {
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  setCurrentTeam: (team: Team) => void;
};

export const initialState = {
  teams: [],
  currentTeam: null,
  isLoading: false,
  setCurrentTeam: (team: Team) => {},
};

const TeamContext = createContext<TeamContextType | null>(initialState);

export const TeamProvider = ({ children }: TeamContextProps): JSX.Element => {
  const { teams, loading, error } = useTeams();
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);

  useEffect(() => {
    if (error?.code === AppErrorType.UNAUTHORIZED) {
      signOut({ callbackUrl: '/login' });
    }
  }, [error]);

  const setCurrentTeam = useCallback((team: Team) => {
    setCurrentTeamState(team);
  }, []);

  const currentTeamId = currentTeam
    ? currentTeam.id
    : typeof localStorage !== 'undefined'
      ? localStorage.getItem('currentTeamId')
      : null;

  const value = useMemo(
    () => ({
      teams: teams || [],
      currentTeam:
        (teams || []).find((team: Team) => team.id === currentTeamId) ||
        (teams || [])[0],
      isLoading: loading,
      setCurrentTeam,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teams, currentTeam, setCurrentTeam, loading, currentTeamId]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => useContext(TeamContext);
