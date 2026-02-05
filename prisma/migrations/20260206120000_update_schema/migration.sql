-- AlterTable Customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "fax" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "invoiceRegistrationNumber" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "invoiceMailingAddress" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "closingDate" TEXT;

-- AlterTable Supplier
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "fax" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "invoiceRegistrationNumber" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "branchName" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "accountType" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "accountHolder" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;

-- AlterTable Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "hourMeter" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "isInvoiceIssued" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "isPaymentReceived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "paymentDate" TIMESTAMP(3);

-- AlterTable ProjectDetail
ALTER TABLE "ProjectDetail" ADD COLUMN "date" TIMESTAMP(3);

-- CreateTable SystemSetting
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateTable MonthlyBillStatus
CREATE TABLE "MonthlyBillStatus" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyBillStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBillStatus_year_month_customerId_key" ON "MonthlyBillStatus"("year", "month", "customerId");

-- AddForeignKey
ALTER TABLE "MonthlyBillStatus" ADD CONSTRAINT "MonthlyBillStatus_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable Quotation
CREATE TABLE "Quotation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "quotationNumber" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable QuotationDetail
CREATE TABLE "QuotationDetail" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "lineType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3),
    "travelType" TEXT,
    "outsourcingDetailType" TEXT,
    "remarks" TEXT,
    "supplier" TEXT,
    "supplierId" INTEGER,

    CONSTRAINT "QuotationDetail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuotationDetail" ADD CONSTRAINT "QuotationDetail_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
