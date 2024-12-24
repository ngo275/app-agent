-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('FIRST_TRIAL_END_REMINDER_EMAIL', 'FINAL_TRIAL_END_REMINDER_EMAIL');

-- CreateEnum
CREATE TYPE "Store" AS ENUM ('APPSTORE', 'GOOGLEPLAY');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('IOS', 'ANDROID', 'MACOS', 'TVOS');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "stripeId" TEXT,
    "subscriptionId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appStoreConnectPrivateKey" TEXT,
    "appStoreConnectKeyId" TEXT,
    "appStoreConnectIssuerId" TEXT,
    "appStoreConnectJWT" TEXT,
    "appStoreConnectJWTExpiresAt" TIMESTAMP(3),
    "googleServiceAccountKey" JSONB,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "stripeId" TEXT,
    "subscriptionId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "limits" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTeam" (
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "UserTeam_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Invitation" (
    "email" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SentEmail" (
    "id" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "SentEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "store" "Store" NOT NULL,
    "platform" "Platform" NOT NULL,
    "storeAppId" TEXT NOT NULL,
    "primaryLocale" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "summary" TEXT,
    "developer" TEXT,
    "developerId" TEXT,
    "developerEmail" TEXT,
    "developerWebsite" TEXT,
    "developerAddress" TEXT,
    "privacyPolicyUrl" TEXT,
    "iconUrl" TEXT,
    "headerImageUrl" TEXT,
    "videoUrl" TEXT,
    "videoImageUrl" TEXT,
    "adSupported" BOOLEAN,
    "containsAds" BOOLEAN,
    "released" TIMESTAMP(3),
    "note" TEXT,
    "isStaged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppVersion" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "appInfoId" TEXT,
    "releaseType" TEXT,
    "state" TEXT,
    "submission" TEXT,
    "platform" "Platform" NOT NULL,
    "minOsVersion" TEXT,
    "size" TEXT,
    "installs" TEXT,
    "minInstalls" INTEGER,
    "realInstalls" INTEGER,
    "androidVersion" TEXT,
    "androidVersionText" TEXT,
    "score" DOUBLE PRECISION,
    "ratings" INTEGER,
    "reviews" INTEGER,
    "histogram" JSONB,
    "price" DOUBLE PRECISION,
    "free" BOOLEAN,
    "currency" TEXT,
    "priceText" TEXT,
    "offersIAP" BOOLEAN,
    "IAPRange" TEXT,
    "contentRating" TEXT,
    "contentRatingDescription" TEXT,
    "update" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppLocalization" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "appVersionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "appInfoLocalizationId" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "description" TEXT,
    "keywords" TEXT,
    "promotionalText" TEXT,
    "whatsNew" TEXT,
    "recentChanges" TEXT,
    "privacyPolicyUrl" TEXT,
    "privacyChoicesUrl" TEXT,
    "privacyPolicyText" TEXT,
    "marketingUrl" TEXT,
    "supportUrl" TEXT,
    "videoUrl" TEXT,
    "videoImageUrl" TEXT,
    "screenshots" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppLocalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsoKeyword" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "store" "Store" NOT NULL,
    "platform" "Platform" NOT NULL,
    "locale" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "trafficScore" DOUBLE PRECISION,
    "difficultyScore" DOUBLE PRECISION,
    "position" INTEGER,
    "overall" DOUBLE PRECISION,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsoKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeId_key" ON "User"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_subscriptionId_key" ON "User"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_stripeId_key" ON "Team"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_subscriptionId_key" ON "Team"("subscriptionId");

-- CreateIndex
CREATE INDEX "UserTeam_userId_idx" ON "UserTeam"("userId");

-- CreateIndex
CREATE INDEX "UserTeam_teamId_idx" ON "UserTeam"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_teamId_key" ON "Invitation"("email", "teamId");

-- CreateIndex
CREATE INDEX "SentEmail_teamId_idx" ON "SentEmail"("teamId");

-- CreateIndex
CREATE INDEX "App_teamId_idx" ON "App"("teamId");

-- CreateIndex
CREATE INDEX "App_store_idx" ON "App"("store");

-- CreateIndex
CREATE INDEX "App_platform_idx" ON "App"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "App_store_storeAppId_key" ON "App"("store", "storeAppId");

-- CreateIndex
CREATE INDEX "AppVersion_appId_idx" ON "AppVersion"("appId");

-- CreateIndex
CREATE INDEX "AppVersion_platform_idx" ON "AppVersion"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "AppVersion_appId_version_platform_key" ON "AppVersion"("appId", "version", "platform");

-- CreateIndex
CREATE INDEX "AppLocalization_appId_idx" ON "AppLocalization"("appId");

-- CreateIndex
CREATE INDEX "AppLocalization_appVersionId_idx" ON "AppLocalization"("appVersionId");

-- CreateIndex
CREATE INDEX "AppLocalization_locale_idx" ON "AppLocalization"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "AppLocalization_appVersionId_locale_key" ON "AppLocalization"("appVersionId", "locale");

-- CreateIndex
CREATE INDEX "AsoKeyword_appId_idx" ON "AsoKeyword"("appId");

-- CreateIndex
CREATE INDEX "AsoKeyword_store_idx" ON "AsoKeyword"("store");

-- CreateIndex
CREATE INDEX "AsoKeyword_platform_idx" ON "AsoKeyword"("platform");

-- CreateIndex
CREATE INDEX "AsoKeyword_locale_idx" ON "AsoKeyword"("locale");

-- CreateIndex
CREATE INDEX "AsoKeyword_keyword_idx" ON "AsoKeyword"("keyword");

-- CreateIndex
CREATE INDEX "AsoKeyword_lastCheckedAt_idx" ON "AsoKeyword"("lastCheckedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AsoKeyword_appId_store_platform_locale_keyword_key" ON "AsoKeyword"("appId", "store", "platform", "locale", "keyword");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "App" ADD CONSTRAINT "App_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppVersion" ADD CONSTRAINT "AppVersion_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppLocalization" ADD CONSTRAINT "AppLocalization_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppLocalization" ADD CONSTRAINT "AppLocalization_appVersionId_fkey" FOREIGN KEY ("appVersionId") REFERENCES "AppVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsoKeyword" ADD CONSTRAINT "AsoKeyword_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;
