import { NextResponse } from 'next/server';

export enum AppErrorType {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  NOT_PERMITTED = 'NOT_PERMITTED',
  APP_STORE_CONNECT_AUTH = 'APP_STORE_CONNECT_AUTH',
  APP_STORE_CONNECT_METADATA = 'APP_STORE_CONNECT_METADATA',
  APP_STORE_CONNECT_VERSIONS = 'APP_STORE_CONNECT_VERSIONS',
  APP_STORE_CONNECT_VERSION_CONFLICT = 'APP_STORE_CONNECT_VERSION_CONFLICT',
  APP_STORE_CONNECT_APPS = 'APP_STORE_CONNECT_APPS',
  APP_STORE_CONNECT_AGREEMENT = 'APP_STORE_CONNECT_AGREEMENT',
  APP_STORE_CONNECT_REVIEW_SUBMISSION = 'APP_STORE_CONNECT_REVIEW_SUBMISSION',
  STORE_CONNECTION_NOT_FOUND = 'STORE_CONNECTION_NOT_FOUND',
  APP_NOT_FOUND = 'APP_NOT_FOUND',
  APP_VERSION_PULL = 'APP_VERSION_PULL',
  APP_VERSION_STAGE = 'APP_VERSION_STAGE',
  APP_VERSION_PUSH = 'APP_VERSION_PUSH',
  APP_LOCALIZE_WHATS_NEW = 'APP_LOCALIZE_WHATS_NEW',
  ASO_TITLE = 'ASO_TITLE',
  ASO_SUBTITLE = 'ASO_SUBTITLE',
  ASO_DESCRIPTION = 'ASO_DESCRIPTION',
  ASO_KEYWORDS = 'ASO_KEYWORDS',
  SHORT_DESCRIPTION_GENERATION = 'SHORT_DESCRIPTION_GENERATION',
  LLM_REFUSAL = 'LLM_REFUSAL',
  MISSING_REQUIRED_PROPERTIES = 'MISSING_REQUIRED_PROPERTIES',
  NO_PLAN_FOUND = 'NO_PLAN_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export function handleAppError(error: Error) {
  console.error(error);
  if (!(error instanceof AppError)) {
    return NextResponse.json(
      new UnknownError(error.message || 'Unknown error'),
      { status: 500 }
    );
  }
  switch (error.code) {
    case AppErrorType.UNAUTHORIZED:
    case AppErrorType.APP_STORE_CONNECT_AUTH:
      return NextResponse.json(error, { status: 401 });
    case AppErrorType.INVALID_PARAMS:
      return NextResponse.json(error, { status: 400 });
    case AppErrorType.NOT_PERMITTED:
      return NextResponse.json(error, { status: 403 });
    case AppErrorType.APP_NOT_FOUND:
      return NextResponse.json(error, { status: 404 });
    case AppErrorType.APP_STORE_CONNECT_VERSION_CONFLICT:
      return NextResponse.json(error, { status: 409 });
    default:
      return NextResponse.json(error, { status: 500 });
  }
}

export interface AppErrorResponse {
  message: string;
  code: AppErrorType | null;
}

export class AppError extends Error {
  public code: AppErrorType;

  constructor(message: string, code: AppErrorType = AppErrorType.UNKNOWN) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
    };
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.UNAUTHORIZED);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class InvalidParamsError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.INVALID_PARAMS);
    Object.setPrototypeOf(this, InvalidParamsError.prototype);
  }
}

export class NotPermittedError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.NOT_PERMITTED);
    Object.setPrototypeOf(this, NotPermittedError.prototype);
  }
}

export class AppStoreConnectAuthError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_STORE_CONNECT_AUTH);
    Object.setPrototypeOf(this, AppStoreConnectAuthError.prototype);
  }
}

export class AppStoreConnectMetadataError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_STORE_CONNECT_METADATA);
    Object.setPrototypeOf(this, AppStoreConnectMetadataError.prototype);
  }
}

export class AppStoreConnectVersionsError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_STORE_CONNECT_VERSIONS);
    Object.setPrototypeOf(this, AppStoreConnectVersionsError.prototype);
  }
}

export class AppStoreConnectVersionConflictError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_STORE_CONNECT_VERSION_CONFLICT);
    Object.setPrototypeOf(this, AppStoreConnectVersionConflictError.prototype);
  }
}

export class AppStoreConnectAppsError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_STORE_CONNECT_APPS);
    Object.setPrototypeOf(this, AppStoreConnectAppsError.prototype);
  }
}

export class StoreConnectionNotFoundError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.STORE_CONNECTION_NOT_FOUND);
    Object.setPrototypeOf(this, StoreConnectionNotFoundError.prototype);
  }
}

export class AppNotFoundError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_NOT_FOUND);
    Object.setPrototypeOf(this, AppNotFoundError.prototype);
  }
}

export class AppVersionPullError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_VERSION_PULL);
    Object.setPrototypeOf(this, AppVersionPullError.prototype);
  }
}

export class AppVersionStageError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_VERSION_STAGE);
    Object.setPrototypeOf(this, AppVersionStageError.prototype);
  }
}

export class AppVersionPushError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_VERSION_PUSH);
    Object.setPrototypeOf(this, AppVersionPushError.prototype);
  }
}

export class AppLocalizeWhatsNewError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_LOCALIZE_WHATS_NEW);
    Object.setPrototypeOf(this, AppLocalizeWhatsNewError.prototype);
  }
}

export class AppStoreConnectAgreementError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_STORE_CONNECT_AGREEMENT);
    Object.setPrototypeOf(this, AppStoreConnectAgreementError.prototype);
  }
}

export class AppStoreConnectReviewSubmissionError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.APP_STORE_CONNECT_REVIEW_SUBMISSION);
    Object.setPrototypeOf(this, AppStoreConnectReviewSubmissionError.prototype);
  }
}

export class AsoTitleError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.ASO_TITLE);
    Object.setPrototypeOf(this, AsoTitleError.prototype);
  }
}

export class AsoSubtitleError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.ASO_SUBTITLE);
    Object.setPrototypeOf(this, AsoSubtitleError.prototype);
  }
}

export class AsoDescriptionError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.ASO_DESCRIPTION);
    Object.setPrototypeOf(this, AsoDescriptionError.prototype);
  }
}

export class AsoKeywordsError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.ASO_KEYWORDS);
    Object.setPrototypeOf(this, AsoKeywordsError.prototype);
  }
}

export class LlmRefusalError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.LLM_REFUSAL);
    Object.setPrototypeOf(this, LlmRefusalError.prototype);
  }
}

export class MissingRequiredPropertiesError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.MISSING_REQUIRED_PROPERTIES);
    Object.setPrototypeOf(this, MissingRequiredPropertiesError.prototype);
  }
}

export class ShortDescriptionGenerationError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.SHORT_DESCRIPTION_GENERATION);
    Object.setPrototypeOf(this, ShortDescriptionGenerationError.prototype);
  }
}

export class NoPlanFoundError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.NO_PLAN_FOUND);
    Object.setPrototypeOf(this, NoPlanFoundError.prototype);
  }
}

export class UnknownError extends AppError {
  constructor(message: string) {
    super(message, AppErrorType.UNKNOWN);
    Object.setPrototypeOf(this, UnknownError.prototype);
  }
}
