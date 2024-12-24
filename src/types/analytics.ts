export enum AnalyticsEvent {
  UserSignedUp = 'User Signed Up',
  UserUpgraded = 'User Upgraded',
  UserSignedIn = 'User Signed In',
  AppAdded = 'App Added',
  NewVersionAdded = 'New Version Added',
}
export type AnalyticsEvents =
  | {
      event: AnalyticsEvent.UserSignedUp;
      userId: string;
      email: string | null | undefined;
    }
  | {
      event: AnalyticsEvent.AppAdded;
      appId: string;
      name: string;
    }
  | {
      event: AnalyticsEvent.NewVersionAdded;
      version: string;
      appId: string;
    }
  | { event: AnalyticsEvent.UserUpgraded; email: string | null | undefined }
  | {
      event: AnalyticsEvent.UserSignedIn;
      email: string | null | undefined;
    };
