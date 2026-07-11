-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT,
    "fileSize" INTEGER,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_leads" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3),
    "name" TEXT,
    "email" TEXT,
    "country_code" TEXT,
    "mobile_without_country_code" TEXT,
    "company" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "lead_owner" TEXT,
    "crm_status" TEXT,
    "crm_note" TEXT,
    "data_source" TEXT,
    "possession_time" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skipped_records" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skipped_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_batches" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "prompt" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "processingTimeMs" INTEGER,
    "status" "BatchStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_batches_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "processed_leads" ADD CONSTRAINT "processed_leads_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skipped_records" ADD CONSTRAINT "skipped_records_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_batches" ADD CONSTRAINT "ai_batches_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
