// Base app information from scraper
export type GooglePlayApp = {
  appId: string;
  title: string;
  summary?: string;
  developer: string;
  developerId: string;
  icon: string;
  score: number;
  scoreText: string;
  priceText: string;
  free: boolean;
  url: string;
  price?: number;
  currency?: string;
  description?: string;
  descriptionHTML?: string;
  installs?: string;
  minInstalls?: number;
  maxInstalls?: number;
  ratings?: number;
  reviews?: number;
  histogram?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  contentRating?: string;
  genre?: string;
  genreId?: string;
  categories?: Array<{ name: string; id: string | null }>;
  video?: string;
  videoImage?: string;
  screenshots?: string[];
  released?: string;
  updated?: number;
  version?: string;
  recentChanges?: string;
  androidVersion?: string;
  androidVersionText?: string;
  developerEmail?: string;
  developerWebsite?: string;
  developerAddress?: string;
  privacyPolicy?: string;
  offersIAP?: boolean;
  IAPRange?: string;
  adSupported?: boolean;
  editorsChoice?: boolean;
  comments?: string[];
};

// Search result type (simplified version)
export type GooglePlaySearchResult = Pick<
  GooglePlayApp,
  | 'appId'
  | 'title'
  | 'summary'
  | 'developer'
  | 'developerId'
  | 'icon'
  | 'score'
  | 'scoreText'
  | 'priceText'
  | 'free'
  | 'url'
>;

// Similar apps result type
export type GooglePlaySimilarApp = GooglePlaySearchResult;
