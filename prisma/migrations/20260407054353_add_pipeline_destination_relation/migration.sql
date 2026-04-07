-- CreateIndex
CREATE INDEX "PipelineJob_destinationId_type_idx" ON "PipelineJob"("destinationId", "type");

-- AddForeignKey
ALTER TABLE "PipelineJob" ADD CONSTRAINT "PipelineJob_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
