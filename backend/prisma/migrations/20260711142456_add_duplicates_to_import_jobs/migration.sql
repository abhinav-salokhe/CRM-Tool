-- AlterTable
ALTER TABLE "import_jobs" ADD COLUMN     "duplicates" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "invalidEmails" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "invalidPhones" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "validEmails" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "validPhones" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "processed_leads" ADD COLUMN     "duplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "duplicate_reason" TEXT;
