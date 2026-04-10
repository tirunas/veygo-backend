-- Photo model (already applied directly to DB)
CREATE TABLE IF NOT EXISTS "Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Photo_entityType_entityId_sortOrder_idx" ON "Photo"("entityType", "entityId", "sortOrder");
CREATE INDEX IF NOT EXISTS "Photo_entityType_entityId_isPrimary_idx" ON "Photo"("entityType", "entityId", "isPrimary");
