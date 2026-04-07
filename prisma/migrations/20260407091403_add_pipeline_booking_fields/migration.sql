-- AlterTable
ALTER TABLE "PipelineItem" ADD COLUMN     "bestTimeToVisit" TEXT,
ADD COLUMN     "bookingUrls" TEXT[],
ADD COLUMN     "category" TEXT,
ADD COLUMN     "officialWebsite" TEXT,
ADD COLUMN     "ticketInfo" TEXT,
ADD COLUMN     "travellerTips" TEXT[];
