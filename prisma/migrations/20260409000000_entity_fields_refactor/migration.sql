-- Attraction: drop content, add hook, tip, photos, nearbyFoodRadiusKm
ALTER TABLE "Attraction"
  DROP COLUMN "content",
  ADD COLUMN "hook" TEXT,
  ADD COLUMN "tip" TEXT,
  ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "nearbyFoodRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- Restaurant: drop content, add signature, reviews, photos, description
ALTER TABLE "Restaurant"
  DROP COLUMN "content",
  ADD COLUMN "description" TEXT,
  ADD COLUMN "signature" TEXT,
  ADD COLUMN "reviews" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Hotel: drop content, add highlights, amenities, roomTypes, walkTo, photos
ALTER TABLE "Hotel"
  DROP COLUMN "content",
  ADD COLUMN "highlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "roomTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "walkTo" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Destination: drop content
ALTER TABLE "Destination"
  DROP COLUMN "content";
