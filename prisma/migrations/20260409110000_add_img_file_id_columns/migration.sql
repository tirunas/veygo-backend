-- imgFileId columns (already applied directly to DB)
ALTER TABLE "Destination" ADD COLUMN IF NOT EXISTS "imgFileId" UUID;
ALTER TABLE "Destination" ADD COLUMN IF NOT EXISTS "heroImageFileId" UUID;
ALTER TABLE "Attraction" ADD COLUMN IF NOT EXISTS "imgFileId" UUID;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "imgFileId" UUID;
ALTER TABLE "Hotel" ADD COLUMN IF NOT EXISTS "imgFileId" UUID;
