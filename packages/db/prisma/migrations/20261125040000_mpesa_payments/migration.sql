-- CreateEnum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'MPESA';

CREATE TYPE "PaymentProvider" AS ENUM ('MPESA');
CREATE TYPE "MpesaEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION', 'LOCAL_SIMULATOR');
CREATE TYPE "MpesaShortcodeType" AS ENUM ('PAYBILL', 'TILL');
CREATE TYPE "MpesaC2bResponseType" AS ENUM ('COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentTransactionFlow" AS ENUM ('STK_PUSH', 'C2B_PAYBILL', 'C2B_TILL');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED', 'UNMATCHED_C2B');
CREATE TYPE "PaymentTargetType" AS ENUM ('POS_ORDER', 'ORDER', 'SALES_INVOICE', 'FULFILLMENT', 'UNMATCHED');

-- CreateTable
CREATE TABLE "mpesa_configuration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "environment" "MpesaEnvironment" NOT NULL DEFAULT 'SANDBOX',
    "shortcodeType" "MpesaShortcodeType" NOT NULL DEFAULT 'PAYBILL',
    "businessShortCode" TEXT NOT NULL,
    "partyB" TEXT,
    "consumerKeyEncrypted" TEXT,
    "consumerSecretEncrypted" TEXT,
    "passkeyEncrypted" TEXT,
    "callbackRouteTokenHash" TEXT NOT NULL,
    "callbackRouteTokenEncrypted" TEXT NOT NULL,
    "callbackIpAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "c2bResponseType" "MpesaC2bResponseType" NOT NULL DEFAULT 'COMPLETED',
    "c2bValidateReference" BOOLEAN NOT NULL DEFAULT true,
    "accountReferencePrefix" TEXT,
    "transactionDescTemplate" TEXT,
    "c2bRegisteredAt" TIMESTAMP(3),
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mpesa_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MPESA',
    "flow" "PaymentTransactionFlow" NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "targetType" "PaymentTargetType" NOT NULL,
    "orderId" TEXT,
    "salesInvoiceId" TEXT,
    "fulfillmentId" TEXT,
    "customerId" TEXT,
    "customerPaymentId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "amountCents" INTEGER NOT NULL,
    "phoneNumber" TEXT,
    "businessShortCode" TEXT NOT NULL,
    "accountReference" TEXT,
    "transactionDesc" TEXT,
    "callbackNonceHash" TEXT,
    "merchantRequestId" TEXT,
    "checkoutRequestId" TEXT,
    "mpesaReceiptNumber" TEXT,
    "resultCode" TEXT,
    "resultDesc" TEXT,
    "payerName" TEXT,
    "callbackMetadata" JSONB,
    "rawCallbackPayload" JSONB,
    "reconciledByUserId" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "initiatedByUserId" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mpesa_configuration_organizationId_key" ON "mpesa_configuration"("organizationId");
CREATE UNIQUE INDEX "mpesa_configuration_callbackRouteTokenHash_key" ON "mpesa_configuration"("callbackRouteTokenHash");
CREATE INDEX "mpesa_configuration_organizationId_businessShortCode_idx" ON "mpesa_configuration"("organizationId", "businessShortCode");

CREATE UNIQUE INDEX "payment_transaction_customerPaymentId_key" ON "payment_transaction"("customerPaymentId");
CREATE UNIQUE INDEX "payment_transaction_organizationId_transactionNumber_key" ON "payment_transaction"("organizationId", "transactionNumber");
CREATE UNIQUE INDEX "payment_transaction_organizationId_checkoutRequestId_key" ON "payment_transaction"("organizationId", "checkoutRequestId");
CREATE UNIQUE INDEX "payment_transaction_organizationId_mpesaReceiptNumber_key" ON "payment_transaction"("organizationId", "mpesaReceiptNumber");
CREATE INDEX "payment_transaction_organizationId_status_createdAt_idx" ON "payment_transaction"("organizationId", "status", "createdAt");
CREATE INDEX "payment_transaction_organizationId_orderId_idx" ON "payment_transaction"("organizationId", "orderId");
CREATE INDEX "payment_transaction_organizationId_salesInvoiceId_idx" ON "payment_transaction"("organizationId", "salesInvoiceId");
CREATE INDEX "payment_transaction_organizationId_fulfillmentId_idx" ON "payment_transaction"("organizationId", "fulfillmentId");
CREATE INDEX "payment_transaction_organizationId_accountReference_idx" ON "payment_transaction"("organizationId", "accountReference");

-- AddForeignKey
ALTER TABLE "mpesa_configuration" ADD CONSTRAINT "mpesa_configuration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "order_fulfillment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_customerPaymentId_fkey" FOREIGN KEY ("customerPaymentId") REFERENCES "customer_payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
