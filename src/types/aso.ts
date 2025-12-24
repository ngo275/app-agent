import {
  App as PrismaApp,
  AppVersion as PrismaAppVersion,
  AppLocalization as PrismaAppLocalization,
  AsoKeyword as PrismaAsoKeyword,
  Competitor as PrismaCompetitor,
} from '@prisma/client';

// Re-export Store and Platform both as types and as enums
export { Store, Platform } from '@prisma/client';

export enum AsoTarget {
  title = 'title',
  subtitle = 'subtitle',
  description = 'description',
  keywords = 'keywords',
  // Google Play specific targets
  shortDescription = 'shortDescription',
  fullDescription = 'fullDescription',
}

export type AsoContent = {
  title: string;
  subtitle: string;
  description: string;
  keywords: string;
  // Google Play specific fields
  shortDescription?: string;
  fullDescription?: string;
};

export type CompetitorKeyword = {
  keyword: string;
  competitors: Competitor[];
};

export type KeywordScore = {
  keyword: string;
  trafficScore: number | null;
  difficultyScore: number | null;
  position: number | null;
  overall: number | null;
  cacheHit: boolean | null;
};

export enum LocalizationEditMode {
  QUICK_RELEASE = 'quick_release',
  IMPROVE_ASO = 'improve_aso',
}

export type App = PrismaApp;
export type AppVersion = PrismaAppVersion & {
  app?: App;
};
export type AppLocalization = PrismaAppLocalization & {
  appVersion?: AppVersion;
  app?: App;
};
export type AsoKeyword = PrismaAsoKeyword & {
  app?: App;
};
export type Competitor = PrismaCompetitor;
