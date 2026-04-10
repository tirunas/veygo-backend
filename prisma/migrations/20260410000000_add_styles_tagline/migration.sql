-- CreateTable
CREATE TABLE "Style" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelLt" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Style_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationStyle" (
    "destinationId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,

    CONSTRAINT "DestinationStyle_pkey" PRIMARY KEY ("destinationId","styleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Style_slug_key" ON "Style"("slug");

-- AlterTable
ALTER TABLE "Destination" DROP COLUMN "styles";

-- AlterTable
ALTER TABLE "Destination" ADD COLUMN "tagline" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "DestinationStyle" ADD CONSTRAINT "DestinationStyle_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationStyle" ADD CONSTRAINT "DestinationStyle_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE CASCADE ON UPDATE CASCADE;
