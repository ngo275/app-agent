-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "guessedKeywords" TEXT[],
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "store" "Store" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Competitor_appId_idx" ON "Competitor"("appId");

-- CreateIndex
CREATE INDEX "Competitor_locale_idx" ON "Competitor"("locale");

-- CreateIndex
CREATE INDEX "Competitor_order_idx" ON "Competitor"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_appId_locale_competitorId_key" ON "Competitor"("appId", "locale", "competitorId");

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "competitors" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;
