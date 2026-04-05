-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "styles" TEXT[],
    "bestSeason" TEXT NOT NULL,
    "imgUrl" TEXT NOT NULL,
    "heroImageUrl" TEXT NOT NULL,
    "currentWeather" TEXT NOT NULL DEFAULT '',
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Destination_name_idx" ON "Destination"("name");
