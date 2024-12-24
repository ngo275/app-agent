import { LocaleCode } from '@/lib/utils/locale';
import { Platform } from '@/types/aso';
export enum AppStoreStoreState {
  PREPARE_FOR_SUBMISSION = 'PREPARE_FOR_SUBMISSION',
  DEVELOPER_REMOVED_FROM_SALE = 'DEVELOPER_REMOVED_FROM_SALE',
  REMOVED_FROM_SALE = 'REMOVED_FROM_SALE',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
}
export enum AppStoreState {
  READY_FOR_SALE = 'READY_FOR_SALE',
  READY_FOR_DISTRIBUTION = 'READY_FOR_DISTRIBUTION',

  REPLACED_WITH_NEW_VERSION = 'REPLACED_WITH_NEW_VERSION',
  REMOVED_FROM_SALE = 'REMOVED_FROM_SALE',
  DEVELOPER_REMOVED_FROM_SALE = 'DEVELOPER_REMOVED_FROM_SALE',

  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  PREPARE_FOR_SUBMISSION = 'PREPARE_FOR_SUBMISSION',
  WAITING_FOR_REVIEW = 'WAITING_FOR_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  REJECTED = 'REJECTED',
  PENDING_DEVELOPER_RELEASE = 'PENDING_DEVELOPER_RELEASE',
}
export enum AppStoreAgeRating {
  FOUR_PLUS = 'FOUR_PLUS',
  NINE_PLUS = 'NINE_PLUS',
  TWELVE_PLUS = 'TWELVE_PLUS',
  FIFTEEN_PLUS = 'FIFTEEN_PLUS',
  EIGHTEEN_PLUS = 'EIGHTEEN_PLUS',
}

export const FIELD_LIMITS = {
  title: 30,
  name: 30,
  subtitle: 30,
  description: 4000,
  promotionalText: 170,
  whatsNew: 4000,
  keywords: 100,
} as const;

export type AppStoreLinks = {
  links: {
    self: string;
    related?: string;
  };
};

export type AppStoreConnectAppData = {
  type: 'apps';
  id: string;
  attributes: {
    bundleId: string;
    contentRightsDeclaration: string;
    isOrEverWasMadeForKids: boolean;
    name: string;
    primaryLocale: LocaleCode;
    sku: string;
  };
};

export type AppStoreConnectAppInfoData = {
  type: 'appInfos';
  id: string;
  attributes: {
    appStoreState: AppStoreStoreState;
    state: AppStoreState;
    appStoreAgeRating: AppStoreAgeRating;
    australianAgeRating: AppStoreAgeRating | null;
    brazilAgeRating: AppStoreAgeRating | null;
    brazilAgeRatingV2: AppStoreAgeRating | null;
    koreaAgeRating: null;
    kidsAgeBand: null;
  };
  relationships: {
    appRatingDeclarations: AppStoreLinks;
    appInfoLocalizations: AppStoreLinks;
    primaryCategory: AppStoreLinks;
    secondaryCategory: AppStoreLinks;
    primarySubcategoryOne: AppStoreLinks;
    primarySubcategoryTwo: AppStoreLinks;
    secondarySubcategoryOne: AppStoreLinks;
    secondarySubcategoryTwo: AppStoreLinks;
  };
  links: AppStoreLinks;
};

export type AppStoreConnectAppInfoLocalization = {
  type: 'appInfoLocalizations';
  id: string;
  attributes: {
    locale: string;
    name: string;
    subtitle: string | null;
    privacyPolicyUrl: string | null;
    privacyChoicesUrl: string | null;
    privacyPolicyText: string | null;
  };
  links: AppStoreLinks;
};

export type AppStoreConnectVersionData = {
  type: 'appStoreVersions';
  id: string;
  attributes: {
    platform: string; // IOS
    versionString: string;
    appStoreState: string; // READY_FOR_SALE, READY_FOR_DISTRIBUTION, REJECTED, REMOVED_FROM_SALE, DEVELOPER_REMOVED_FROM_SALE, PREPARE_FOR_SUBMISSION, WAITING_FOR_REVIEW, IN_REVIEW
    appVersionState: string; // READY_FOR_SALE, READY_FOR_DISTRIBUTION, REJECTED, REMOVED_FROM_SALE, DEVELOPER_REMOVED_FROM_SALE, PREPARE_FOR_SUBMISSION, WAITING_FOR_REVIEW, IN_REVIEW
    copyright: string;
    reviewType: string; // APP_STORE
    releaseType: string; // AFTER_APPROVAL
    earliestReleaseDate: string | null;
    usesIdfa: boolean | null;
    downloadable: boolean;
    createdDate: string; // e.g., 2023-08-14T22:09:47-07:00
  };
};

export type AppStoreConnectVersionLocalization = {
  type: 'appStoreVersionLocalizations';
  id: string;
  attributes: {
    locale: string; // en-US, etc.
    description: string;
    keywords: string;
    marketingUrl: string;
    promotionalText: string;
    supportUrl: string;
    whatsNew: string; // Release notes
  };
  relationships: {
    appScreenshotSets: {
      links: {
        self: string;
        related: string;
      };
    };
    appPreviewSets: {
      links: {
        self: string;
        related: string;
      };
    };
  };
  links: {
    self: string;
  };
};

export type AppStoreConnectBuild = {
  type: 'builds';
  id: string;
  attributes: {
    processingState: string; // PROCESSING, VALIDATION_EXCEPTION, VALID
    version: string; // Internal version number a developer assigns
    uploadedDate: string; // Date the build was uploaded to App Store Connect
    usesNonExemptEncryption: boolean | null; // This cannot be null to procee
  };
  relationships: {
    appStoreVersion: {
      data: {
        id: string;
      } | null;
    };
  };
};

export type AppStoreReviewSubmission = {
  type: 'reviewSubmissions';
  id: string;
  attributes: {
    platform: Platform;
    state: string;
    submittedDate: string | null;
  };
};

export type AppStoreReviewSubmissionItem = {
  type: 'reviewSubmissionItems';
  id: string;
  attributes: {
    state: string; // e.g., 'READY_FOR_REVIEW'
  };
  relationships: {
    appStoreVersion: {
      data: {
        id: string;
        type: 'appStoreVersions';
      } | null;
    };
  };
};

export type AppStoreAnalyticsReportRequest = {
  id: string;
  type: 'analyticsReportRequests';
  attributes: {
    accessType: 'ONGOING';
    stoppedDueToInactivity: boolean;
  };
};

export type AppStoreAnalyticsReport = {
  id: string;
  type: 'analyticsReports';
  attributes: {
    name: string;
    category: string;
  };
  relationships: {
    instances: {
      links: {
        self: string;
        related: string;
      };
    };
  };
};

export type { App as AppStoreApp } from 'app-store-client';

// export interface AppMetadata {
//   id: string;
//   locale: string;
//   name: string;
//   subtitle: string;
//   description: string;
//   keywords: string;
//   marketingUrl: string;
//   promotionalText: string;
//   supportUrl: string;
//   whatsNew: string;
// }

// export interface AppInfo {
//   id: string;
//   attributes: {
//     appInfoLocalizations: AppMetadata[];
//   };
// }
