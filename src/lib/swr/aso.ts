'use client';

import { useTeam } from '@/context/team';
import { LocaleCode } from '@/lib/utils/locale';
import {
  AsoTarget,
  AsoKeyword,
  Platform,
  Store,
  AsoContent,
} from '@/types/aso';
import { fetcher } from '../utils/fetcher';
import { useState } from 'react';
import useSWR from 'swr';

export function useGetAsoKeywords(appId: string, locale: LocaleCode) {
  const teamInfo = useTeam();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    data: keywords,
    error,
    mutate,
    isLoading,
  } = useSWR<AsoKeyword[]>(
    teamInfo?.currentTeam?.id && appId && locale
      ? `/api/teams/${teamInfo.currentTeam.id}/apps/${appId}/localizations/${locale}/keyword`
      : null,
    fetcher
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
  };

  return {
    keywords,
    loading: isLoading,
    error,
    isRefreshing,
    refresh,
  };
}

export async function suggestKeywords(
  teamId: string,
  appId: string,
  locale: LocaleCode,
  shortDescription: string,
  store: Store,
  platform: Platform,
  onData: (data: any) => void
) {
  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/localizations/${locale}/keyword`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortDescription, store, platform }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let receivedText = '';

  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      receivedText += chunk;

      const lines = receivedText.split('\n');
      // Keep the last partial line
      receivedText = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const data = JSON.parse(line);
          onData(data);
        } catch (err) {
          console.error('Failed to parse JSON:', line, err);
        }
      }
    }
    // Handle any remaining text
    if (receivedText.trim() !== '') {
      try {
        const data = JSON.parse(receivedText);
        onData(data);
      } catch (err) {
        console.error('Failed to parse JSON:', receivedText, err);
      }
    }
  } else {
    const text = await response.text();
    console.error('No readable stream in response body', text);
    throw new Error('No readable stream in response body');
  }
}

export async function deleteKeyword(
  teamId: string,
  appId: string,
  locale: LocaleCode,
  keywordId: string
) {
  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/localizations/${locale}/keyword/${keywordId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}

export async function addKeyword(
  teamId: string,
  appId: string,
  locale: LocaleCode,
  term: string
) {
  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/localizations/${locale}/keyword/add`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  const data = await response.json();
  return data as AsoKeyword;
}

export async function optimizeContents(
  teamId: string,
  appId: string,
  locale: LocaleCode,
  title: string,
  asoKeywords: AsoKeyword[],
  targets: AsoTarget[],
  subtitle?: string,
  keywords?: string,
  description?: string,
  descriptionOutline?: string,
  previousResult?: {
    title?: string;
    subtitle?: string;
    description?: string;
    keywords?: string;
  },
  userFeedback?: string
) {
  const response = await fetch(
    `/api/teams/${teamId}/apps/${appId}/localizations/${locale}/optimization`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        asoKeywords,
        targets,
        subtitle,
        keywords,
        description,
        descriptionOutline,
        previousResult,
        userFeedback,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  const data = (await response.json()) as AsoContent;
  return data;
}
