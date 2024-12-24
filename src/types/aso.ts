import {
  App as PrismaApp,
  AppVersion as PrismaAppVersion,
  AppLocalization as PrismaAppLocalization,
  Platform as PrismaPlatform,
  Store as PrismaStore,
  AsoKeyword as PrismaAsoKeyword,
} from '@prisma/client';

export enum AsoTarget {
  title = 'title',
  subtitle = 'subtitle',
  description = 'description',
  keywords = 'keywords',
}

export type AsoContent = {
  title: string;
  subtitle: string;
  description: string;
  keywords: string;
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
};
export type Store = PrismaStore;
export type Platform = PrismaPlatform;
export type AsoKeyword = PrismaAsoKeyword & {
  app?: App;
};
