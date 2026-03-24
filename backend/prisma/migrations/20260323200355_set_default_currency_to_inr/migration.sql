-- AlterTable
ALTER TABLE "CompanyProfile" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "RecurringSchedule" ALTER COLUMN "currency" SET DEFAULT 'INR';
