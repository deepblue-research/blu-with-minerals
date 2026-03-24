-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "RecurringSchedule" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';
