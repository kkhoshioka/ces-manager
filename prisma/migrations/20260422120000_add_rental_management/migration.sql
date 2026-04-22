-- AlterTable Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "customerContactName" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "rentalStartDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "rentalEndDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "actualReturnDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "rentalStatus" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "deliveryLocation" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "outboundHourMeter" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "inboundHourMeter" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "isDeliveryNoteIssued" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable ProjectDetail
ALTER TABLE "ProjectDetail" ADD COLUMN IF NOT EXISTS "outsourcingDetailType" TEXT;
ALTER TABLE "ProjectDetail" ADD COLUMN IF NOT EXISTS "laborType" TEXT;
ALTER TABLE "ProjectDetail" ADD COLUMN IF NOT EXISTS "machineModel" TEXT;
ALTER TABLE "ProjectDetail" ADD COLUMN IF NOT EXISTS "serialNumber" TEXT;
ALTER TABLE "ProjectDetail" ADD COLUMN IF NOT EXISTS "rentalBillingType" TEXT;

-- AlterTable CustomerMachine
ALTER TABLE "CustomerMachine" ADD COLUMN IF NOT EXISTS "hourMeter" TEXT;
ALTER TABLE "CustomerMachine" ADD COLUMN IF NOT EXISTS "lastInspectionDate" TIMESTAMP(3);
ALTER TABLE "CustomerMachine" ADD COLUMN IF NOT EXISTS "nextInspectionDate" TIMESTAMP(3);
ALTER TABLE "CustomerMachine" ADD COLUMN IF NOT EXISTS "enableInspectionAlert" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CustomerMachine" ADD COLUMN IF NOT EXISTS "manufacturingDate" TEXT;
ALTER TABLE "CustomerMachine" ADD COLUMN IF NOT EXISTS "deliveryDate" TIMESTAMP(3);

-- AlterTable QuotationDetail
ALTER TABLE "QuotationDetail" ADD COLUMN IF NOT EXISTS "laborType" TEXT;
