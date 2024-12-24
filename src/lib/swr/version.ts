import { useTeam } from '@/context/team';
import useSWR from 'swr';
import { fetcher } from '../utils/fetcher';
import { useState } from 'react';
import {
  AppStoreConnectAppInfoLocalization,
  AppStoreState,
} from '@/types/app-store';
import {
  AppLocalizeWhatsNewError,
  AppNotFoundError,
  AppVersionPullError,
  AppVersionPushError,
  AppVersionStageError,
} from '@/types/errors';
import { LocaleCode } from '../utils/locale';
import { AppLocalization } from '@/types/aso';

export function useVersionCheck(appId: string) {
  const teamInfo = useTeam();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: versionStatus,
    error,
    mutate,
    isLoading,
  } = useSWR<{
    upToDate: boolean;
    localVersion: {
      version: string;
      state: AppStoreState;
      id: string;
    };
    remoteVersion: {
      version: string;
      state: AppStoreState;
      id: string;
    };
  }>(
    teamInfo?.currentTeam?.id && appId
      ? `/api/teams/${teamInfo.currentTeam.id}/apps/${appId}/versions/check`
      : null,
    fetcher
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
  };

  return {
    versionStatus,
    loading: isLoading,
    error,
    isRefreshing,
    refresh,
  };
}

export async function createNewVersion(
  teamId: string,
  appId: string,
  versionString: string
) {
  if (!teamId || !appId)
    throw new AppNotFoundError('App not found in the current team');

  const response = await fetch(`/api/teams/${teamId}/apps/${appId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ versionString }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  const data = await response.json();
  return data;
}

export async function pullLatestVersion(teamId: string, appId: string) {
  if (!teamId || !appId)
    throw new AppNotFoundError('App not found in the current team');

  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/versions/pull`,
    {
      method: 'POST',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  const data = await response.json();
  return data;
}

/**
 * This function saves the localizations to the database as a draft version
 * @param teamId
 * @param appId
 * @param localizations
 */
export async function stageVersion(
  teamId: string,
  appId: string,
  localizations: AppLocalization[]
) {
  if (!teamId || !appId)
    throw new AppNotFoundError('App not found in the current team');

  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/localizations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(localizations),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  const data = await response.json();
  return data;
}

/**
 * This function pushes the staged version to the App Store
 * @param appId
 */
export async function pushVersion(
  teamId: string,
  appId: string,
  versionId: string
) {
  if (!teamId || !appId)
    throw new AppNotFoundError('App not found in the current team');

  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/versions/push`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ versionId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  const data = await response.json();
  return data;
}

/**
 * This function localizes the whatsNew message for the given localizations
 * @param teamId
 * @param appId
 * @param whatsNew The draft whatsNew message to localize
 * @param localizations The previous localizations for the app (the last published ones)
 * @param version The draft version of the app
 * @param platform The platform of the app a user is building for
 * @returns
 */
export async function localizeWhatsNew(
  teamId: string,
  appId: string,
  whatsNew: string,
  localizations: AppLocalization[],
  version: string,
  platform: string
) {
  if (!teamId || !appId)
    throw new AppNotFoundError('App not found in the current team');

  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/versions/change-log`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ whatsNew, localizations, version, platform }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  const data = await response.json();
  return data.localizations;
}

export async function addNewLocale(
  teamId: string,
  appId: string,
  locale: LocaleCode
) {
  if (!teamId || !appId)
    throw new AppNotFoundError('App not found in the current team');

  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/localizations/${locale}`,
    {
      method: 'POST',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  const data = await response.json();
  return data;
}
