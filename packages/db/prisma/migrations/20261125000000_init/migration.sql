-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SELLABLE', 'MERCH', 'RAW_MATERIAL', 'SERVICE', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ItemRevisionAction" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED', 'RESTORED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'RETAIL_STORE');

-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN', 'SALE', 'SALE_RETURN', 'PRODUCTION_CONSUMPTION', 'PRODUCTION_OUTPUT');

-- CreateEnum
CREATE TYPE "LotAllocationStrategy" AS ENUM ('FEFO', 'FIFO', 'MANUAL');

-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('DRAFT', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VendorBillStatus" AS ENUM ('DRAFT', 'OPEN', 'PARTIALLY_PAID', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('PENDING_QC', 'QC_IN_PROGRESS', 'QC_COMPLETED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryLineQcStatus" AS ENUM ('PENDING', 'PASSED', 'PARTIAL', 'FAILED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "RejectionDisposition" AS ENUM ('REOPEN_PO', 'SUPPLIER_CLAIM', 'QUARANTINE', 'SCRAP');

-- CreateEnum
CREATE TYPE "QuarantineStatus" AS ENUM ('OPEN', 'RELEASED_TO_STOCK', 'RETURNED_TO_SUPPLIER', 'CLAIMED', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "SupplierClaimType" AS ENUM ('CREDIT', 'REPLACEMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "SupplierClaimStatus" AS ENUM ('OPEN', 'SUBMITTED', 'CREDITED', 'REPLACED', 'CLOSED');

-- CreateEnum
CREATE TYPE "StoredObjectStatus" AS ENUM ('PENDING', 'READY', 'DELETED');

-- CreateEnum
CREATE TYPE "StorageEntityType" AS ENUM ('ORGANIZATION', 'ITEM', 'VENDOR_BILL', 'PURCHASE_ORDER', 'GOODS_RECEIPT', 'GOODS_RECEIPT_LINE', 'STOCK_LOT', 'PRODUCTION_BATCH', 'PRODUCTION_OPERATION', 'PRODUCTION_QC_CHECKPOINT', 'SUPPLIER', 'CUSTOMER', 'ORDER', 'SALES_INVOICE', 'PAYMENT_RECEIPT');

-- CreateEnum
CREATE TYPE "AttachmentDocumentType" AS ENUM ('PACKING_SLIP', 'BILL_OF_LADING', 'COA', 'QC_PHOTO', 'INSPECTION_REPORT', 'SUPPLIER_INVOICE', 'SAFETY_DATA_SHEET', 'OTHER');

-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('PREBOARDING', 'ACTIVE', 'ON_LEAVE', 'OFFBOARDED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('VACATION', 'SICK', 'PERSONAL', 'PARENTAL', 'UNPAID', 'OTHER');

-- CreateEnum
CREATE TYPE "TimeOffStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TeamKind" AS ENUM ('PROJECT', 'RESOURCE_POOL', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CalendarFeedScope" AS ENUM ('STAFF', 'TEAM', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "CrmProvider" AS ENUM ('CUSTOMERMATES');

-- CreateEnum
CREATE TYPE "CrmWebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ServicePlanType" AS ENUM ('RETAINER', 'HOUR_PACK', 'SUBSCRIPTION', 'MILESTONE');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('ONE_TIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "PriceBookDirection" AS ENUM ('SALES', 'PURCHASE');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('FLAT', 'VOLUME', 'GRADUATED', 'PACKAGE');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE', 'BUY_X_GET_Y');

-- CreateEnum
CREATE TYPE "DiscountScope" AS ENUM ('LINE_ITEM', 'ORDER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('POS', 'B2B');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH');

-- CreateEnum
CREATE TYPE "CustomerPaymentStatus" AS ENUM ('COMPLETED', 'VOIDED');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('PREORDER', 'PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStage" AS ENUM ('NONE', 'OUT_FOR_DELIVERY', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PreorderDepositStatus" AS ENUM ('NOT_REQUIRED', 'UNPAID', 'DEPOSIT_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "StaffJobStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('PREORDER_READY', 'JOB_COMPLETED', 'DELIVERY_OUT_FOR_DELIVERY', 'DELIVERY_DELIVERED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('SENT', 'SANDBOX', 'FALLBACK_SENT', 'SKIPPED_DISABLED', 'FAILED');

-- CreateEnum
CREATE TYPE "OAuthClientType" AS ENUM ('PUBLIC_PKCE', 'CONFIDENTIAL', 'M2M_SERVICE', 'DEVICE_TERMINAL');

-- CreateEnum
CREATE TYPE "OAuthAppCategory" AS ENUM ('ANDROID_MOBILE', 'POS_TERMINAL', 'PRODUCTION_SYSTEM', 'ERP_INTEGRATION', 'WEB_APP', 'OTHER');

-- CreateEnum
CREATE TYPE "OAuthClientStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "OAuthSigningAlgorithm" AS ENUM ('RS256', 'ES256', 'EDDSA');

-- CreateEnum
CREATE TYPE "OAuthDeviceCodeStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CONSUMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RegisteredDeviceType" AS ENUM ('ANDROID', 'POS_TERMINAL', 'PRODUCTION_KIOSK', 'SCANNER', 'SYSTEM_AGENT');

-- CreateEnum
CREATE TYPE "RegisteredDeviceStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SsoProviderType" AS ENUM ('GOOGLE', 'MICROSOFT_ENTRA', 'OKTA', 'OIDC');

-- CreateEnum
CREATE TYPE "WorkCenterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OverheadAllocationType" AS ENUM ('FIXED_PER_HOUR', 'PERCENT_OF_LABOR', 'PER_UNIT');

-- CreateEnum
CREATE TYPE "BomStatus" AS ENUM ('DRAFT', 'ACTIVE', 'REVISED', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "BomIssueMethod" AS ENUM ('MANUAL', 'BACKFLUSH');

-- CreateEnum
CREATE TYPE "SubAssemblyStrategy" AS ENUM ('MAKE_TO_STOCK', 'CONSUME_STOCK_ONLY', 'CONSUME_STOCK_OR_EXPLODE', 'ALWAYS_EXPLODE');

-- CreateEnum
CREATE TYPE "RoutingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "ProductionBatchStatus" AS ENUM ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'QC_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ProductionQcStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PASSED', 'FAILED', 'WAIVED');

-- CreateEnum
CREATE TYPE "ProductionOperationStatus" AS ENUM ('PENDING', 'SCHEDULED', 'READY', 'IN_PROGRESS', 'PAUSED', 'QC_PENDING', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionQcCheckpointType" AS ENUM ('IN_PROCESS', 'FINAL_RELEASE');

-- CreateEnum
CREATE TYPE "ProductionQcCheckpointStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'WAIVED');

-- CreateEnum
CREATE TYPE "ProductionCostCategory" AS ENUM ('MATERIAL', 'LABOR', 'MACHINE', 'OVERHEAD', 'SCRAP', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeOrganizationId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "inviterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyLegalName" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
    "storageBucket" TEXT,
    "storageQuotaBytes" BIGINT NOT NULL DEFAULT 1073741824,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ItemType" NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'unit',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "salePriceCents" INTEGER NOT NULL DEFAULT 0,
    "costPriceCents" INTEGER NOT NULL DEFAULT 0,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
    "reorderPoint" INTEGER,
    "isBundle" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_revision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "action" "ItemRevisionAction" NOT NULL,
    "changes" JSONB NOT NULL,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_balance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "onHandQty" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdByUserId" TEXT,
    "dispatchedByUserId" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "receivedByUserId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stockTransferId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transfer_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "taxId" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "packId" TEXT,
    "supplierSku" TEXT,
    "unitCostCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "leadTimeDays" INTEGER,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "expectedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submittedByUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "packId" TEXT,
    "unitsPerPack" INTEGER NOT NULL DEFAULT 1,
    "orderedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "receivedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "acceptedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "rejectedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "quarantinedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "creditedClaimBaseQty" INTEGER NOT NULL DEFAULT 0,
    "billedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "supplierSku" TEXT,
    "description" TEXT,
    "orderedQty" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "unitCostCents" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,
    "pricingSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'PENDING_QC',
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "packingSlipNumber" TEXT,
    "notes" TEXT,
    "receivedByUserId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qcStartedAt" TIMESTAMP(3),
    "qcCompletedAt" TIMESTAMP(3),
    "qcByUserId" TEXT,
    "qcNotes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "acceptanceNotes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "purchaseOrderLineId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "packId" TEXT,
    "supplierItemId" TEXT,
    "supplierBatchNumber" TEXT,
    "unitsPerPack" INTEGER NOT NULL DEFAULT 1,
    "packQty" INTEGER NOT NULL DEFAULT 0,
    "looseBaseQty" INTEGER NOT NULL DEFAULT 0,
    "receivedQty" INTEGER NOT NULL,
    "receivedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "unitCostCents" INTEGER NOT NULL,
    "lotNumber" TEXT,
    "batchCode" TEXT,
    "manufacturedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "serialNumbers" JSONB,
    "qcStatus" "DeliveryLineQcStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "rejectedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "quarantinedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "rejectionDisposition" "RejectionDisposition",
    "defectReasonCode" TEXT,
    "qcNotes" TEXT,
    "qcInspectedByUserId" TEXT,
    "qcInspectedAt" TIMESTAMP(3),
    "billedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipt_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_lot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "goodsReceiptLineId" TEXT,
    "supplierId" TEXT,
    "supplierItemId" TEXT,
    "supplierSku" TEXT,
    "supplierBatchNumber" TEXT,
    "lotNumber" TEXT NOT NULL,
    "batchCode" TEXT,
    "manufacturedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "serialNumbers" JSONB,
    "onHandQty" INTEGER NOT NULL DEFAULT 0,
    "quarantinedQty" INTEGER NOT NULL DEFAULT 0,
    "initialQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "consumedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unitCostCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarantine_hold" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "goodsReceiptLineId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "stockLotId" TEXT,
    "quantityBase" INTEGER NOT NULL,
    "resolvedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "status" "QuarantineStatus" NOT NULL DEFAULT 'OPEN',
    "reasonCode" TEXT,
    "notes" TEXT,
    "resolutionNotes" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarantine_hold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_claim" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "goodsReceiptId" TEXT,
    "goodsReceiptLineId" TEXT,
    "itemId" TEXT NOT NULL,
    "claimType" "SupplierClaimType" NOT NULL DEFAULT 'CREDIT',
    "status" "SupplierClaimStatus" NOT NULL DEFAULT 'OPEN',
    "rejectedBaseQty" INTEGER NOT NULL,
    "claimAmountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reasonCode" TEXT,
    "notes" TEXT,
    "resolutionNotes" TEXT,
    "createdByUserId" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bill" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "goodsReceiptId" TEXT,
    "status" "VendorBillStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "paidAmountCents" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bill_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vendorBillId" TEXT NOT NULL,
    "itemId" TEXT,
    "goodsReceiptLineId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "baseQty" INTEGER NOT NULL DEFAULT 0,
    "unitCostCents" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_bill_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_object" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "etag" TEXT,
    "status" "StoredObjectStatus" NOT NULL DEFAULT 'PENDING',
    "entityType" "StorageEntityType" NOT NULL DEFAULT 'ORGANIZATION',
    "entityId" TEXT,
    "uploadedByUserId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stored_object_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_attachment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storedObjectId" TEXT NOT NULL,
    "documentType" "AttachmentDocumentType" NOT NULL DEFAULT 'OTHER',
    "caption" TEXT,
    "goodsReceiptId" TEXT,
    "goodsReceiptLineId" TEXT,
    "stockLotId" TEXT,
    "productionBatchId" TEXT,
    "productionOperationId" TEXT,
    "productionQcCheckpointId" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "parentDepartmentId" TEXT,
    "leadStaffId" TEXT,
    "status" "DepartmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "weeklyCapacityMinutes" INTEGER NOT NULL DEFAULT 2400,
    "workingDays" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT,
    "employeeCode" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "phone" TEXT,
    "jobTitle" TEXT,
    "departmentId" TEXT,
    "managerStaffId" TEXT,
    "locationId" TEXT,
    "workScheduleId" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "weeklyCapacityMinutes" INTEGER NOT NULL DEFAULT 2400,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "offboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRecurringAnnual" BOOLEAN NOT NULL DEFAULT false,
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "locationId" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_off_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalMinutes" INTEGER NOT NULL,
    "status" "TimeOffStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "reviewedByStaffId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_off_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "kind" "TeamKind" NOT NULL DEFAULT 'PROJECT',
    "status" "TeamStatus" NOT NULL DEFAULT 'ACTIVE',
    "departmentId" TEXT,
    "leadStaffId" TEXT,
    "defaultAllocationPct" INTEGER NOT NULL DEFAULT 100,
    "metadata" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "roleInTeam" TEXT NOT NULL DEFAULT 'member',
    "allocationPct" INTEGER NOT NULL DEFAULT 100,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_feed" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "CalendarFeedScope" NOT NULL,
    "staffId" TEXT,
    "teamId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "includeTimeOff" BOOLEAN NOT NULL DEFAULT true,
    "includeHolidays" BOOLEAN NOT NULL DEFAULT true,
    "includeShifts" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_connection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "CrmProvider" NOT NULL DEFAULT 'CUSTOMERMATES',
    "baseUrl" TEXT NOT NULL,
    "workspaceId" TEXT,
    "apiKeyEncrypted" TEXT NOT NULL,
    "apiKeyLast4" TEXT NOT NULL,
    "webhookSecretEncrypted" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sandboxMode" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestMessage" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_staff_mapping" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "externalEmail" TEXT,
    "externalName" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_staff_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deal_item_link" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalDealId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "packId" TEXT,
    "servicePlanId" TEXT,
    "priceBookId" TEXT,
    "promoCode" TEXT,
    "externalServiceId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "baseSubtotalCents" INTEGER,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "appliedPricing" JSONB,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deal_item_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_webhook_event" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "eventType" TEXT NOT NULL,
    "externalEntityType" TEXT,
    "externalEntityId" TEXT,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "status" "CrmWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "crm_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_pack" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "unitsPerPack" INTEGER NOT NULL DEFAULT 1,
    "barcode" TEXT,
    "packSku" TEXT,
    "salePriceCents" INTEGER,
    "costPriceCents" INTEGER,
    "isSellable" BOOLEAN NOT NULL DEFAULT true,
    "isPurchasable" BOOLEAN NOT NULL DEFAULT true,
    "isDefaultSalesPack" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultPurchasePack" BOOLEAN NOT NULL DEFAULT false,
    "minOrderPacks" INTEGER NOT NULL DEFAULT 1,
    "packStep" INTEGER NOT NULL DEFAULT 1,
    "weightGrams" INTEGER,
    "dimensionsJson" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_bundle_component" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bundleItemId" TEXT NOT NULL,
    "componentItemId" TEXT NOT NULL,
    "componentPackId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceAllocationBps" INTEGER,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_bundle_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_plan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "planType" "ServicePlanType" NOT NULL DEFAULT 'HOUR_PACK',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'ONE_TIME',
    "includedUnits" INTEGER NOT NULL DEFAULT 1,
    "unitLabel" TEXT NOT NULL DEFAULT 'hours',
    "basePriceCents" INTEGER NOT NULL,
    "overageUnitPriceCents" INTEGER,
    "setupFeeCents" INTEGER NOT NULL DEFAULT 0,
    "rolloverEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxRolloverUnits" INTEGER,
    "validityDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_book" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "direction" "PriceBookDirection" NOT NULL DEFAULT 'SALES',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customerSegment" TEXT,
    "externalAccountId" TEXT,
    "supplierId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "customAttributes" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "priceBookId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "packId" TEXT,
    "servicePlanId" TEXT,
    "name" TEXT NOT NULL,
    "pricingModel" "PricingModel" NOT NULL DEFAULT 'FLAT',
    "baseUnitPriceCents" INTEGER NOT NULL,
    "minMarginBps" INTEGER,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "conditions" JSONB,
    "customAdjustment" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_tier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "priceRuleId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER,
    "unitPriceCents" INTEGER,
    "flatFeeCents" INTEGER,
    "packageSize" INTEGER,
    "packagePriceCents" INTEGER,
    "discountBps" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "price_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_rule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "promoCode" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "scope" "DiscountScope" NOT NULL DEFAULT 'LINE_ITEM',
    "valueBps" INTEGER,
    "amountCents" INTEGER,
    "fixedPriceCents" INTEGER,
    "buyQuantity" INTEGER,
    "getQuantity" INTEGER,
    "getDiscountBps" INTEGER,
    "targetItemId" TEXT,
    "targetPackId" TEXT,
    "targetTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customerSegments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "externalAccountIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minQuantity" INTEGER,
    "minOrderSubtotalCents" INTEGER,
    "maxDiscountCents" INTEGER,
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "taxId" TEXT,
    "customerSegment" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "billingAddressLine1" TEXT,
    "billingAddressLine2" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingPostalCode" TEXT,
    "billingCountry" TEXT,
    "shippingAddressLine1" TEXT,
    "shippingAddressLine2" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingPostalCode" TEXT,
    "shippingCountry" TEXT,
    "crmProvider" "CrmProvider",
    "externalContactId" TEXT,
    "externalCompanyId" TEXT,
    "externalAccountId" TEXT,
    "crmLastSyncedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "channel" "OrderChannel" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "locationId" TEXT NOT NULL,
    "customerId" TEXT,
    "priceBookId" TEXT,
    "externalDealId" TEXT,
    "customerSegment" TEXT,
    "promoCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountTotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "paidAmountCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "confirmedByUserId" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "fulfilledByUserId" TEXT,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "packId" TEXT,
    "servicePlanId" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'unit',
    "unitsPerPack" INTEGER NOT NULL DEFAULT 1,
    "quantity" INTEGER NOT NULL,
    "fulfilledQty" INTEGER NOT NULL DEFAULT 0,
    "orderedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "reservedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "fulfilledBaseQty" INTEGER NOT NULL DEFAULT 0,
    "bonusUnits" INTEGER NOT NULL DEFAULT 0,
    "unitPriceCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "lineTotalCents" INTEGER NOT NULL,
    "pricingSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "SalesInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountTotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "paidAmountCents" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "notes" TEXT,
    "customerSnapshot" JSONB,
    "organizationSnapshot" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_invoice_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "salesInvoiceId" TEXT NOT NULL,
    "orderLineId" TEXT,
    "itemId" TEXT,
    "sku" TEXT,
    "description" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'unit',
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "lineTotalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_invoice_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "salesInvoiceId" TEXT,
    "customerId" TEXT,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "CustomerPaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amountAppliedCents" INTEGER NOT NULL,
    "cashTenderedCents" INTEGER NOT NULL,
    "changeGivenCents" INTEGER NOT NULL DEFAULT 0,
    "reference" TEXT,
    "notes" TEXT,
    "receivedByUserId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_receipt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "salesInvoiceId" TEXT,
    "customerId" TEXT,
    "channel" "OrderChannel" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalCents" INTEGER NOT NULL,
    "cashTenderedCents" INTEGER NOT NULL,
    "changeGivenCents" INTEGER NOT NULL DEFAULT 0,
    "snapshot" JSONB NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "autoConvertPreordersToJobs" BOOLEAN NOT NULL DEFAULT false,
    "defaultJobLeadMinutes" INTEGER NOT NULL DEFAULT 120,
    "defaultJobAssigneeStaffId" TEXT,
    "defaultJobAssigneeRole" TEXT,
    "syncJobsToCrm" BOOLEAN NOT NULL DEFAULT false,
    "defaultChannel" "CommunicationChannel" NOT NULL DEFAULT 'SMS',
    "autoNotifyOnPreorderReady" BOOLEAN NOT NULL DEFAULT true,
    "autoNotifyOnJobCompleted" BOOLEAN NOT NULL DEFAULT true,
    "autoNotifyOnDeliveryUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_fulfillment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fulfillmentNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "customerId" TEXT,
    "type" "FulfillmentType" NOT NULL,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryStage" "DeliveryStage" NOT NULL DEFAULT 'NONE',
    "stockReserved" BOOLEAN NOT NULL DEFAULT false,
    "stockDeducted" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFulfillmentAt" TIMESTAMP(3),
    "depositRequiredCents" INTEGER NOT NULL DEFAULT 0,
    "depositStatus" "PreorderDepositStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "preparationNotes" TEXT,
    "autoConvertToJob" BOOLEAN,
    "pickupWindowStart" TIMESTAMP(3),
    "pickupWindowEnd" TIMESTAMP(3),
    "pickupInstructions" TEXT,
    "handoffConfirmedAt" TIMESTAMP(3),
    "handoffConfirmedByUserId" TEXT,
    "deliveryAddressLine1" TEXT,
    "deliveryAddressLine2" TEXT,
    "deliveryCity" TEXT,
    "deliveryState" TEXT,
    "deliveryPostalCode" TEXT,
    "deliveryCountry" TEXT,
    "deliveryInstructions" TEXT,
    "deliveryWindowStart" TIMESTAMP(3),
    "deliveryWindowEnd" TIMESTAMP(3),
    "courierStaffId" TEXT,
    "courierName" TEXT,
    "courierPhone" TEXT,
    "outForDeliveryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredChannel" "CommunicationChannel",
    "notifyOnPreorderReady" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnJobCompleted" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnDeliveryUpdates" BOOLEAN NOT NULL DEFAULT true,
    "confirmedAt" TIMESTAMP(3),
    "confirmedByUserId" TEXT,
    "readyAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_job" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "fulfillmentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "status" "StaffJobStatus" NOT NULL DEFAULT 'ASSIGNED',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "assignedStaffId" TEXT,
    "assignedDepartmentId" TEXT,
    "assignedTeamId" TEXT,
    "assignedRole" TEXT,
    "targetDueAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "startedByUserId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "syncToCrm" BOOLEAN NOT NULL DEFAULT false,
    "externalTaskId" TEXT,
    "crmSyncedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fulfillmentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "staffJobId" TEXT,
    "customerId" TEXT,
    "eventType" "NotificationEventType" NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "triggerSource" TEXT NOT NULL DEFAULT 'AUTO',
    "recipient" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL,
    "provider" TEXT,
    "externalMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "sentByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_signing_key" (
    "id" TEXT NOT NULL,
    "kid" TEXT NOT NULL,
    "algorithm" "OAuthSigningAlgorithm" NOT NULL DEFAULT 'ES256',
    "publicJwk" JSONB NOT NULL,
    "encryptedPrivateKeyPem" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_signing_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_client" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientType" "OAuthClientType" NOT NULL,
    "appCategory" "OAuthAppCategory" NOT NULL DEFAULT 'OTHER',
    "status" "OAuthClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "clientSecretHash" TEXT,
    "clientSecretLast4" TEXT,
    "authMethods" TEXT[] DEFAULT ARRAY['client_secret_basic']::TEXT[],
    "allowedGrantTypes" TEXT[] DEFAULT ARRAY['client_credentials']::TEXT[],
    "redirectUris" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serviceRole" TEXT NOT NULL DEFAULT 'member',
    "locationId" TEXT,
    "ipAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jwksUri" TEXT,
    "isFirstParty" BOOLEAN NOT NULL DEFAULT false,
    "requireConsent" BOOLEAN NOT NULL DEFAULT true,
    "accessTokenTtlSeconds" INTEGER NOT NULL DEFAULT 900,
    "refreshTokenTtlSeconds" INTEGER NOT NULL DEFAULT 2592000,
    "createdByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_client_key" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "oauthClientId" TEXT NOT NULL,
    "kid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "algorithm" "OAuthSigningAlgorithm" NOT NULL DEFAULT 'ES256',
    "publicKeyPem" TEXT NOT NULL,
    "publicJwk" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_client_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_authorization_code" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "oauthClientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "codeChallenge" TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL DEFAULT 'S256',
    "nonce" TEXT,
    "deviceIdentifier" TEXT,
    "deviceName" TEXT,
    "deviceOsVersion" TEXT,
    "deviceAppVersion" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_authorization_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_device_code" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "oauthClientId" TEXT NOT NULL,
    "locationId" TEXT,
    "deviceCodeHash" TEXT NOT NULL,
    "userCode" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "OAuthDeviceCodeStatus" NOT NULL DEFAULT 'PENDING',
    "deviceName" TEXT,
    "deviceIdentifier" TEXT,
    "deviceType" "RegisteredDeviceType" NOT NULL DEFAULT 'POS_TERMINAL',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "deniedByUserId" TEXT,
    "deniedAt" TIMESTAMP(3),
    "intervalSeconds" INTEGER NOT NULL DEFAULT 5,
    "lastPolledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_device_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_refresh_token" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "oauthClientId" TEXT NOT NULL,
    "userId" TEXT,
    "registeredDeviceId" TEXT,
    "familyId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_access_token" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "lastUsedIp" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_access_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registered_device" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "oauthClientId" TEXT,
    "userId" TEXT,
    "locationId" TEXT,
    "deviceType" "RegisteredDeviceType" NOT NULL,
    "deviceIdentifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "status" "RegisteredDeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "trusted" BOOLEAN NOT NULL DEFAULT true,
    "ipAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastSeenAt" TIMESTAMP(3),
    "lastIp" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "revokeReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registered_device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_sso_provider" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "providerType" "SsoProviderType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "issuerUrl" TEXT,
    "authorizationEndpoint" TEXT,
    "tokenEndpoint" TEXT,
    "userinfoEndpoint" TEXT,
    "jwksUri" TEXT,
    "clientId" TEXT NOT NULL,
    "encryptedClientSecret" TEXT,
    "clientSecretLast4" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY['openid', 'profile', 'email']::TEXT[],
    "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "autoProvisionRole" TEXT NOT NULL DEFAULT 'member',
    "enforceSsoOnly" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_sso_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_center" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkCenterStatus" NOT NULL DEFAULT 'ACTIVE',
    "dailyCapacityMinutes" INTEGER NOT NULL DEFAULT 480,
    "hourlyLaborRateCents" INTEGER NOT NULL DEFAULT 0,
    "hourlyMachineRateCents" INTEGER NOT NULL DEFAULT 0,
    "overheadRateCents" INTEGER NOT NULL DEFAULT 0,
    "overheadType" "OverheadAllocationType" NOT NULL DEFAULT 'FIXED_PER_HOUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_center_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_of_material" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "packId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "yieldQty" INTEGER NOT NULL DEFAULT 1,
    "status" "BomStatus" NOT NULL DEFAULT 'DRAFT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "standardOverheadCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_of_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL DEFAULT 1,
    "componentItemId" TEXT NOT NULL,
    "packId" TEXT,
    "unitsPerPack" INTEGER NOT NULL DEFAULT 1,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "baseQuantity" INTEGER NOT NULL DEFAULT 1,
    "scrapBps" INTEGER NOT NULL DEFAULT 0,
    "issueMethod" "BomIssueMethod" NOT NULL DEFAULT 'MANUAL',
    "subAssemblyStrategy" "SubAssemblyStrategy" NOT NULL DEFAULT 'CONSUME_STOCK_OR_EXPLODE',
    "operationSequence" INTEGER,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RoutingStatus" NOT NULL DEFAULT 'DRAFT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_operation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "routingId" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "operationCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setupMinutes" INTEGER NOT NULL DEFAULT 0,
    "runMinutesPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiresQcGate" BOOLEAN NOT NULL DEFAULT false,
    "qcChecklistTemplate" JSONB,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_batch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "name" TEXT,
    "locationId" TEXT NOT NULL,
    "outputItemId" TEXT,
    "bomId" TEXT,
    "routingId" TEXT,
    "parentBatchId" TEXT,
    "status" "ProductionBatchStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" "ProductionPriority" NOT NULL DEFAULT 'NORMAL',
    "qcStatus" "ProductionQcStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "plannedOutputQty" INTEGER NOT NULL DEFAULT 1,
    "actualOutputQty" INTEGER NOT NULL DEFAULT 0,
    "scrapQty" INTEGER NOT NULL DEFAULT 0,
    "outputLotId" TEXT,
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "releasedByUserId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "requiresFinalQcRelease" BOOLEAN NOT NULL DEFAULT false,
    "qcReleasedAt" TIMESTAMP(3),
    "qcReleasedByUserId" TEXT,
    "standardMaterialCostCents" INTEGER NOT NULL DEFAULT 0,
    "standardLaborCostCents" INTEGER NOT NULL DEFAULT 0,
    "standardMachineCostCents" INTEGER NOT NULL DEFAULT 0,
    "standardOverheadCostCents" INTEGER NOT NULL DEFAULT 0,
    "standardTotalCostCents" INTEGER NOT NULL DEFAULT 0,
    "actualMaterialCostCents" INTEGER NOT NULL DEFAULT 0,
    "actualLaborCostCents" INTEGER NOT NULL DEFAULT 0,
    "actualMachineCostCents" INTEGER NOT NULL DEFAULT 0,
    "actualOverheadCostCents" INTEGER NOT NULL DEFAULT 0,
    "actualScrapCostCents" INTEGER NOT NULL DEFAULT 0,
    "actualTotalCostCents" INTEGER NOT NULL DEFAULT 0,
    "costVarianceCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_material_reservation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productionBatchId" TEXT NOT NULL,
    "bomLineId" TEXT,
    "itemId" TEXT NOT NULL,
    "packId" TEXT,
    "locationId" TEXT NOT NULL,
    "stockLotId" TEXT,
    "routingOperationId" TEXT,
    "unitsPerPack" INTEGER NOT NULL DEFAULT 1,
    "requiredBaseQty" INTEGER NOT NULL,
    "scrapAllowanceQty" INTEGER NOT NULL DEFAULT 0,
    "reservedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "issuedBaseQty" INTEGER NOT NULL DEFAULT 0,
    "issueMethod" "BomIssueMethod" NOT NULL DEFAULT 'MANUAL',
    "subAssemblyStrategy" "SubAssemblyStrategy" NOT NULL DEFAULT 'CONSUME_STOCK_OR_EXPLODE',
    "allocationStrategy" "LotAllocationStrategy" NOT NULL DEFAULT 'FEFO',
    "operationSequence" INTEGER,
    "isReleased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_material_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_operation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productionBatchId" TEXT NOT NULL,
    "routingOperationId" TEXT,
    "workCenterId" TEXT NOT NULL,
    "assignedStaffId" TEXT,
    "sequence" INTEGER NOT NULL,
    "operationCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProductionOperationStatus" NOT NULL DEFAULT 'PENDING',
    "plannedSetupMinutes" INTEGER NOT NULL DEFAULT 0,
    "plannedRunMinutes" INTEGER NOT NULL DEFAULT 0,
    "actualSetupMinutes" INTEGER NOT NULL DEFAULT 0,
    "actualRunMinutes" INTEGER NOT NULL DEFAULT 0,
    "plannedQty" INTEGER NOT NULL DEFAULT 1,
    "completedQty" INTEGER NOT NULL DEFAULT 0,
    "scrapQty" INTEGER NOT NULL DEFAULT 0,
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "operatorSignOffUserId" TEXT,
    "signedOffAt" TIMESTAMP(3),
    "backflushedAt" TIMESTAMP(3),
    "signOffStaffId" TEXT,
    "signOffNotes" TEXT,
    "requiresQcGate" BOOLEAN NOT NULL DEFAULT false,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_time_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productionBatchId" TEXT NOT NULL,
    "productionOperationId" TEXT NOT NULL,
    "workCenterId" TEXT,
    "staffId" TEXT,
    "userId" TEXT,
    "logType" TEXT NOT NULL DEFAULT 'RUN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL,
    "hourlyLaborRateCents" INTEGER NOT NULL DEFAULT 0,
    "hourlyMachineRateCents" INTEGER NOT NULL DEFAULT 0,
    "overheadRateCents" INTEGER NOT NULL DEFAULT 0,
    "overheadType" "OverheadAllocationType" NOT NULL DEFAULT 'FIXED_PER_HOUR',
    "laborCostCents" INTEGER NOT NULL DEFAULT 0,
    "machineCostCents" INTEGER NOT NULL DEFAULT 0,
    "overheadCostCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_time_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_qc_checkpoint" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productionBatchId" TEXT NOT NULL,
    "productionOperationId" TEXT,
    "checkpointType" "ProductionQcCheckpointType" NOT NULL DEFAULT 'IN_PROCESS',
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProductionQcCheckpointStatus" NOT NULL DEFAULT 'PENDING',
    "checklistTemplate" JSONB,
    "checklistResults" JSONB,
    "disposition" TEXT,
    "notes" TEXT,
    "inspectorUserId" TEXT,
    "conductedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "inspectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_qc_checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_cost_entry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productionBatchId" TEXT NOT NULL,
    "category" "ProductionCostCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unitCostCents" INTEGER,
    "totalCostCents" INTEGER NOT NULL,
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_cost_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_consumption" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productionBatchId" TEXT NOT NULL,
    "productionOperationId" TEXT,
    "itemId" TEXT NOT NULL,
    "locationId" TEXT,
    "packId" TEXT,
    "stockLotId" TEXT NOT NULL,
    "unitsPerPack" INTEGER NOT NULL DEFAULT 1,
    "packQty" INTEGER NOT NULL DEFAULT 0,
    "looseBaseQty" INTEGER NOT NULL DEFAULT 0,
    "consumedBaseQty" INTEGER NOT NULL,
    "unitCostCents" INTEGER NOT NULL DEFAULT 0,
    "totalCostCents" INTEGER NOT NULL DEFAULT 0,
    "allocationStrategy" "LotAllocationStrategy" NOT NULL DEFAULT 'FEFO',
    "consumedByUserId" TEXT,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "production_consumption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_organizationId_key" ON "tenant_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_storageBucket_key" ON "tenant_settings"("storageBucket");

-- CreateIndex
CREATE INDEX "audit_log_organizationId_createdAt_idx" ON "audit_log"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "item_organizationId_status_type_idx" ON "item"("organizationId", "status", "type");

-- CreateIndex
CREATE INDEX "item_organizationId_updatedAt_idx" ON "item"("organizationId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "item_organizationId_sku_key" ON "item"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "item_revision_organizationId_itemId_version_idx" ON "item_revision"("organizationId", "itemId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "item_revision_itemId_version_key" ON "item_revision"("itemId", "version");

-- CreateIndex
CREATE INDEX "location_organizationId_status_type_idx" ON "location"("organizationId", "status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "location_organizationId_code_key" ON "location"("organizationId", "code");

-- CreateIndex
CREATE INDEX "stock_balance_organizationId_locationId_idx" ON "stock_balance"("organizationId", "locationId");

-- CreateIndex
CREATE INDEX "stock_balance_organizationId_itemId_idx" ON "stock_balance"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_balance_organizationId_itemId_locationId_key" ON "stock_balance"("organizationId", "itemId", "locationId");

-- CreateIndex
CREATE INDEX "stock_movement_organizationId_itemId_locationId_createdAt_idx" ON "stock_movement"("organizationId", "itemId", "locationId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movement_organizationId_createdAt_idx" ON "stock_movement"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_transfer_organizationId_status_idx" ON "stock_transfer"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_organizationId_transferNumber_key" ON "stock_transfer"("organizationId", "transferNumber");

-- CreateIndex
CREATE INDEX "stock_transfer_line_organizationId_stockTransferId_idx" ON "stock_transfer_line"("organizationId", "stockTransferId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_line_stockTransferId_itemId_key" ON "stock_transfer_line"("stockTransferId", "itemId");

-- CreateIndex
CREATE INDEX "supplier_organizationId_status_idx" ON "supplier"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_organizationId_code_key" ON "supplier"("organizationId", "code");

-- CreateIndex
CREATE INDEX "supplier_item_organizationId_itemId_idx" ON "supplier_item"("organizationId", "itemId");

-- CreateIndex
CREATE INDEX "supplier_item_organizationId_supplierId_idx" ON "supplier_item"("organizationId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_item_organizationId_supplierId_itemId_key" ON "supplier_item"("organizationId", "supplierId", "itemId");

-- CreateIndex
CREATE INDEX "purchase_order_organizationId_supplierId_status_idx" ON "purchase_order"("organizationId", "supplierId", "status");

-- CreateIndex
CREATE INDEX "purchase_order_organizationId_locationId_idx" ON "purchase_order"("organizationId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_organizationId_poNumber_key" ON "purchase_order"("organizationId", "poNumber");

-- CreateIndex
CREATE INDEX "purchase_order_line_organizationId_purchaseOrderId_idx" ON "purchase_order_line"("organizationId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "goods_receipt_organizationId_purchaseOrderId_idx" ON "goods_receipt"("organizationId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "goods_receipt_organizationId_locationId_idx" ON "goods_receipt"("organizationId", "locationId");

-- CreateIndex
CREATE INDEX "goods_receipt_organizationId_status_idx" ON "goods_receipt"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_organizationId_receiptNumber_key" ON "goods_receipt"("organizationId", "receiptNumber");

-- CreateIndex
CREATE INDEX "goods_receipt_line_organizationId_goodsReceiptId_idx" ON "goods_receipt_line"("organizationId", "goodsReceiptId");

-- CreateIndex
CREATE INDEX "goods_receipt_line_organizationId_purchaseOrderLineId_idx" ON "goods_receipt_line"("organizationId", "purchaseOrderLineId");

-- CreateIndex
CREATE INDEX "goods_receipt_line_organizationId_supplierItemId_idx" ON "goods_receipt_line"("organizationId", "supplierItemId");

-- CreateIndex
CREATE INDEX "stock_lot_organizationId_itemId_locationId_idx" ON "stock_lot"("organizationId", "itemId", "locationId");

-- CreateIndex
CREATE INDEX "stock_lot_organizationId_lotNumber_idx" ON "stock_lot"("organizationId", "lotNumber");

-- CreateIndex
CREATE INDEX "stock_lot_organizationId_expiresAt_idx" ON "stock_lot"("organizationId", "expiresAt");

-- CreateIndex
CREATE INDEX "stock_lot_organizationId_supplierId_idx" ON "stock_lot"("organizationId", "supplierId");

-- CreateIndex
CREATE INDEX "stock_lot_organizationId_supplierItemId_idx" ON "stock_lot"("organizationId", "supplierItemId");

-- CreateIndex
CREATE INDEX "quarantine_hold_organizationId_status_idx" ON "quarantine_hold"("organizationId", "status");

-- CreateIndex
CREATE INDEX "quarantine_hold_organizationId_goodsReceiptId_idx" ON "quarantine_hold"("organizationId", "goodsReceiptId");

-- CreateIndex
CREATE INDEX "quarantine_hold_organizationId_itemId_idx" ON "quarantine_hold"("organizationId", "itemId");

-- CreateIndex
CREATE INDEX "supplier_claim_organizationId_supplierId_status_idx" ON "supplier_claim"("organizationId", "supplierId", "status");

-- CreateIndex
CREATE INDEX "supplier_claim_organizationId_purchaseOrderId_idx" ON "supplier_claim"("organizationId", "purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_claim_organizationId_claimNumber_key" ON "supplier_claim"("organizationId", "claimNumber");

-- CreateIndex
CREATE INDEX "vendor_bill_organizationId_status_dueAt_idx" ON "vendor_bill"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "vendor_bill_organizationId_purchaseOrderId_idx" ON "vendor_bill"("organizationId", "purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bill_organizationId_supplierId_billNumber_key" ON "vendor_bill"("organizationId", "supplierId", "billNumber");

-- CreateIndex
CREATE INDEX "vendor_bill_line_organizationId_vendorBillId_idx" ON "vendor_bill_line"("organizationId", "vendorBillId");

-- CreateIndex
CREATE INDEX "vendor_bill_line_organizationId_goodsReceiptLineId_idx" ON "vendor_bill_line"("organizationId", "goodsReceiptLineId");

-- CreateIndex
CREATE INDEX "stored_object_organizationId_status_createdAt_idx" ON "stored_object"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "stored_object_organizationId_entityType_entityId_idx" ON "stored_object"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "stored_object_organizationId_bucket_objectKey_key" ON "stored_object"("organizationId", "bucket", "objectKey");

-- CreateIndex
CREATE INDEX "document_attachment_organizationId_goodsReceiptId_idx" ON "document_attachment"("organizationId", "goodsReceiptId");

-- CreateIndex
CREATE INDEX "document_attachment_organizationId_goodsReceiptLineId_idx" ON "document_attachment"("organizationId", "goodsReceiptLineId");

-- CreateIndex
CREATE INDEX "document_attachment_organizationId_stockLotId_idx" ON "document_attachment"("organizationId", "stockLotId");

-- CreateIndex
CREATE INDEX "document_attachment_organizationId_productionBatchId_idx" ON "document_attachment"("organizationId", "productionBatchId");

-- CreateIndex
CREATE INDEX "document_attachment_organizationId_productionOperationId_idx" ON "document_attachment"("organizationId", "productionOperationId");

-- CreateIndex
CREATE INDEX "document_attachment_organizationId_productionQcCheckpointId_idx" ON "document_attachment"("organizationId", "productionQcCheckpointId");

-- CreateIndex
CREATE INDEX "document_attachment_organizationId_storedObjectId_idx" ON "document_attachment"("organizationId", "storedObjectId");

-- CreateIndex
CREATE INDEX "department_organizationId_status_idx" ON "department"("organizationId", "status");

-- CreateIndex
CREATE INDEX "department_organizationId_parentDepartmentId_idx" ON "department"("organizationId", "parentDepartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "department_organizationId_code_key" ON "department"("organizationId", "code");

-- CreateIndex
CREATE INDEX "work_schedule_organizationId_isDefault_isActive_idx" ON "work_schedule"("organizationId", "isDefault", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedule_organizationId_name_key" ON "work_schedule"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profile_memberId_key" ON "staff_profile"("memberId");

-- CreateIndex
CREATE INDEX "staff_profile_organizationId_status_idx" ON "staff_profile"("organizationId", "status");

-- CreateIndex
CREATE INDEX "staff_profile_organizationId_departmentId_idx" ON "staff_profile"("organizationId", "departmentId");

-- CreateIndex
CREATE INDEX "staff_profile_organizationId_managerStaffId_idx" ON "staff_profile"("organizationId", "managerStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profile_organizationId_workEmail_key" ON "staff_profile"("organizationId", "workEmail");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profile_organizationId_employeeCode_key" ON "staff_profile"("organizationId", "employeeCode");

-- CreateIndex
CREATE INDEX "holiday_organizationId_date_idx" ON "holiday"("organizationId", "date");

-- CreateIndex
CREATE INDEX "holiday_organizationId_locationId_idx" ON "holiday"("organizationId", "locationId");

-- CreateIndex
CREATE INDEX "time_off_request_organizationId_staffId_status_idx" ON "time_off_request"("organizationId", "staffId", "status");

-- CreateIndex
CREATE INDEX "time_off_request_organizationId_startDate_endDate_idx" ON "time_off_request"("organizationId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "team_organizationId_status_kind_idx" ON "team"("organizationId", "status", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "team_organizationId_slug_key" ON "team"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "team_member_organizationId_staffId_idx" ON "team_member"("organizationId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_organizationId_teamId_staffId_key" ON "team_member"("organizationId", "teamId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_feed_tokenHash_key" ON "calendar_feed"("tokenHash");

-- CreateIndex
CREATE INDEX "calendar_feed_organizationId_scope_idx" ON "calendar_feed"("organizationId", "scope");

-- CreateIndex
CREATE INDEX "calendar_feed_organizationId_staffId_idx" ON "calendar_feed"("organizationId", "staffId");

-- CreateIndex
CREATE INDEX "calendar_feed_organizationId_teamId_idx" ON "calendar_feed"("organizationId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_connection_organizationId_key" ON "crm_connection"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_staff_mapping_staffId_key" ON "crm_staff_mapping"("staffId");

-- CreateIndex
CREATE INDEX "crm_staff_mapping_organizationId_staffId_idx" ON "crm_staff_mapping"("organizationId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_staff_mapping_organizationId_externalUserId_key" ON "crm_staff_mapping"("organizationId", "externalUserId");

-- CreateIndex
CREATE INDEX "crm_deal_item_link_organizationId_externalDealId_idx" ON "crm_deal_item_link"("organizationId", "externalDealId");

-- CreateIndex
CREATE INDEX "crm_deal_item_link_organizationId_itemId_idx" ON "crm_deal_item_link"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_deal_item_link_organizationId_externalDealId_itemId_key" ON "crm_deal_item_link"("organizationId", "externalDealId", "itemId");

-- CreateIndex
CREATE INDEX "crm_webhook_event_organizationId_eventType_receivedAt_idx" ON "crm_webhook_event"("organizationId", "eventType", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "crm_webhook_event_organizationId_deliveryId_key" ON "crm_webhook_event"("organizationId", "deliveryId");

-- CreateIndex
CREATE INDEX "item_pack_organizationId_itemId_isActive_idx" ON "item_pack"("organizationId", "itemId", "isActive");

-- CreateIndex
CREATE INDEX "item_pack_organizationId_packSku_idx" ON "item_pack"("organizationId", "packSku");

-- CreateIndex
CREATE UNIQUE INDEX "item_pack_organizationId_itemId_code_key" ON "item_pack"("organizationId", "itemId", "code");

-- CreateIndex
CREATE INDEX "item_bundle_component_organizationId_bundleItemId_idx" ON "item_bundle_component"("organizationId", "bundleItemId");

-- CreateIndex
CREATE UNIQUE INDEX "item_bundle_component_organizationId_bundleItemId_component_key" ON "item_bundle_component"("organizationId", "bundleItemId", "componentItemId");

-- CreateIndex
CREATE INDEX "service_plan_organizationId_itemId_isActive_idx" ON "service_plan"("organizationId", "itemId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "service_plan_organizationId_itemId_code_key" ON "service_plan"("organizationId", "itemId", "code");

-- CreateIndex
CREATE INDEX "price_book_organizationId_direction_isActive_priority_idx" ON "price_book"("organizationId", "direction", "isActive", "priority");

-- CreateIndex
CREATE INDEX "price_book_organizationId_customerSegment_idx" ON "price_book"("organizationId", "customerSegment");

-- CreateIndex
CREATE INDEX "price_book_organizationId_externalAccountId_idx" ON "price_book"("organizationId", "externalAccountId");

-- CreateIndex
CREATE INDEX "price_book_organizationId_supplierId_idx" ON "price_book"("organizationId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "price_book_organizationId_code_key" ON "price_book"("organizationId", "code");

-- CreateIndex
CREATE INDEX "price_rule_organizationId_priceBookId_itemId_isActive_idx" ON "price_rule"("organizationId", "priceBookId", "itemId", "isActive");

-- CreateIndex
CREATE INDEX "price_rule_organizationId_itemId_packId_idx" ON "price_rule"("organizationId", "itemId", "packId");

-- CreateIndex
CREATE INDEX "price_tier_organizationId_priceRuleId_minQuantity_idx" ON "price_tier"("organizationId", "priceRuleId", "minQuantity");

-- CreateIndex
CREATE INDEX "discount_rule_organizationId_isActive_promoCode_idx" ON "discount_rule"("organizationId", "isActive", "promoCode");

-- CreateIndex
CREATE INDEX "discount_rule_organizationId_targetItemId_idx" ON "discount_rule"("organizationId", "targetItemId");

-- CreateIndex
CREATE UNIQUE INDEX "discount_rule_organizationId_code_key" ON "discount_rule"("organizationId", "code");

-- CreateIndex
CREATE INDEX "customer_organizationId_status_type_idx" ON "customer"("organizationId", "status", "type");

-- CreateIndex
CREATE INDEX "customer_organizationId_externalContactId_idx" ON "customer"("organizationId", "externalContactId");

-- CreateIndex
CREATE INDEX "customer_organizationId_externalCompanyId_idx" ON "customer"("organizationId", "externalCompanyId");

-- CreateIndex
CREATE INDEX "customer_organizationId_email_idx" ON "customer"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_organizationId_code_key" ON "customer"("organizationId", "code");

-- CreateIndex
CREATE INDEX "sales_order_organizationId_channel_status_idx" ON "sales_order"("organizationId", "channel", "status");

-- CreateIndex
CREATE INDEX "sales_order_organizationId_customerId_idx" ON "sales_order"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "sales_order_organizationId_locationId_idx" ON "sales_order"("organizationId", "locationId");

-- CreateIndex
CREATE INDEX "sales_order_organizationId_createdAt_idx" ON "sales_order"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_organizationId_orderNumber_key" ON "sales_order"("organizationId", "orderNumber");

-- CreateIndex
CREATE INDEX "sales_order_line_organizationId_orderId_idx" ON "sales_order_line"("organizationId", "orderId");

-- CreateIndex
CREATE INDEX "sales_order_line_organizationId_itemId_idx" ON "sales_order_line"("organizationId", "itemId");

-- CreateIndex
CREATE INDEX "sales_invoice_organizationId_status_dueAt_idx" ON "sales_invoice"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "sales_invoice_organizationId_orderId_idx" ON "sales_invoice"("organizationId", "orderId");

-- CreateIndex
CREATE INDEX "sales_invoice_organizationId_customerId_idx" ON "sales_invoice"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoice_organizationId_invoiceNumber_key" ON "sales_invoice"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "sales_invoice_line_organizationId_salesInvoiceId_idx" ON "sales_invoice_line"("organizationId", "salesInvoiceId");

-- CreateIndex
CREATE INDEX "customer_payment_organizationId_orderId_idx" ON "customer_payment"("organizationId", "orderId");

-- CreateIndex
CREATE INDEX "customer_payment_organizationId_salesInvoiceId_idx" ON "customer_payment"("organizationId", "salesInvoiceId");

-- CreateIndex
CREATE INDEX "customer_payment_organizationId_customerId_idx" ON "customer_payment"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_payment_organizationId_paymentNumber_key" ON "customer_payment"("organizationId", "paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payment_receipt_paymentId_key" ON "payment_receipt"("paymentId");

-- CreateIndex
CREATE INDEX "payment_receipt_organizationId_orderId_idx" ON "payment_receipt"("organizationId", "orderId");

-- CreateIndex
CREATE INDEX "payment_receipt_organizationId_customerId_idx" ON "payment_receipt"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "payment_receipt_organizationId_issuedAt_idx" ON "payment_receipt"("organizationId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_receipt_organizationId_receiptNumber_key" ON "payment_receipt"("organizationId", "receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "fulfillment_settings_organizationId_key" ON "fulfillment_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "order_fulfillment_orderId_key" ON "order_fulfillment"("orderId");

-- CreateIndex
CREATE INDEX "order_fulfillment_organizationId_type_status_idx" ON "order_fulfillment"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "order_fulfillment_organizationId_customerId_idx" ON "order_fulfillment"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "order_fulfillment_organizationId_locationId_idx" ON "order_fulfillment"("organizationId", "locationId");

-- CreateIndex
CREATE INDEX "order_fulfillment_organizationId_scheduledFulfillmentAt_idx" ON "order_fulfillment"("organizationId", "scheduledFulfillmentAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_fulfillment_organizationId_fulfillmentNumber_key" ON "order_fulfillment"("organizationId", "fulfillmentNumber");

-- CreateIndex
CREATE INDEX "staff_job_organizationId_fulfillmentId_status_idx" ON "staff_job"("organizationId", "fulfillmentId", "status");

-- CreateIndex
CREATE INDEX "staff_job_organizationId_assignedStaffId_status_idx" ON "staff_job"("organizationId", "assignedStaffId", "status");

-- CreateIndex
CREATE INDEX "staff_job_organizationId_targetDueAt_idx" ON "staff_job"("organizationId", "targetDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_job_organizationId_jobNumber_key" ON "staff_job"("organizationId", "jobNumber");

-- CreateIndex
CREATE INDEX "notification_template_organizationId_eventType_idx" ON "notification_template"("organizationId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_organizationId_eventType_channel_key" ON "notification_template"("organizationId", "eventType", "channel");

-- CreateIndex
CREATE INDEX "customer_notification_organizationId_fulfillmentId_createdA_idx" ON "customer_notification"("organizationId", "fulfillmentId", "createdAt");

-- CreateIndex
CREATE INDEX "customer_notification_organizationId_orderId_idx" ON "customer_notification"("organizationId", "orderId");

-- CreateIndex
CREATE INDEX "customer_notification_organizationId_customerId_idx" ON "customer_notification"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_signing_key_kid_key" ON "auth_signing_key"("kid");

-- CreateIndex
CREATE INDEX "auth_signing_key_isActive_isPrimary_idx" ON "auth_signing_key"("isActive", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_client_clientId_key" ON "oauth_client"("clientId");

-- CreateIndex
CREATE INDEX "oauth_client_organizationId_status_idx" ON "oauth_client"("organizationId", "status");

-- CreateIndex
CREATE INDEX "oauth_client_organizationId_appCategory_idx" ON "oauth_client"("organizationId", "appCategory");

-- CreateIndex
CREATE INDEX "oauth_client_key_organizationId_oauthClientId_isActive_idx" ON "oauth_client_key"("organizationId", "oauthClientId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_client_key_oauthClientId_kid_key" ON "oauth_client_key"("oauthClientId", "kid");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_authorization_code_codeHash_key" ON "oauth_authorization_code"("codeHash");

-- CreateIndex
CREATE INDEX "oauth_authorization_code_organizationId_oauthClientId_idx" ON "oauth_authorization_code"("organizationId", "oauthClientId");

-- CreateIndex
CREATE INDEX "oauth_authorization_code_expiresAt_idx" ON "oauth_authorization_code"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_device_code_deviceCodeHash_key" ON "oauth_device_code"("deviceCodeHash");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_device_code_userCode_key" ON "oauth_device_code"("userCode");

-- CreateIndex
CREATE INDEX "oauth_device_code_organizationId_status_idx" ON "oauth_device_code"("organizationId", "status");

-- CreateIndex
CREATE INDEX "oauth_device_code_expiresAt_idx" ON "oauth_device_code"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_refresh_token_tokenHash_key" ON "oauth_refresh_token"("tokenHash");

-- CreateIndex
CREATE INDEX "oauth_refresh_token_organizationId_familyId_idx" ON "oauth_refresh_token"("organizationId", "familyId");

-- CreateIndex
CREATE INDEX "oauth_refresh_token_organizationId_userId_idx" ON "oauth_refresh_token"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "oauth_refresh_token_registeredDeviceId_idx" ON "oauth_refresh_token"("registeredDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "personal_access_token_tokenPrefix_key" ON "personal_access_token"("tokenPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "personal_access_token_tokenHash_key" ON "personal_access_token"("tokenHash");

-- CreateIndex
CREATE INDEX "personal_access_token_organizationId_userId_idx" ON "personal_access_token"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "personal_access_token_organizationId_revokedAt_idx" ON "personal_access_token"("organizationId", "revokedAt");

-- CreateIndex
CREATE INDEX "registered_device_organizationId_deviceType_status_idx" ON "registered_device"("organizationId", "deviceType", "status");

-- CreateIndex
CREATE INDEX "registered_device_organizationId_userId_idx" ON "registered_device"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "registered_device_organizationId_deviceIdentifier_deviceTyp_key" ON "registered_device"("organizationId", "deviceIdentifier", "deviceType");

-- CreateIndex
CREATE INDEX "organization_sso_provider_organizationId_enabled_idx" ON "organization_sso_provider"("organizationId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "organization_sso_provider_organizationId_providerKey_key" ON "organization_sso_provider"("organizationId", "providerKey");

-- CreateIndex
CREATE INDEX "work_center_organizationId_locationId_status_idx" ON "work_center"("organizationId", "locationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "work_center_organizationId_code_key" ON "work_center"("organizationId", "code");

-- CreateIndex
CREATE INDEX "bill_of_material_organizationId_itemId_status_idx" ON "bill_of_material"("organizationId", "itemId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bill_of_material_organizationId_code_key" ON "bill_of_material"("organizationId", "code");

-- CreateIndex
CREATE INDEX "bom_line_organizationId_bomId_idx" ON "bom_line"("organizationId", "bomId");

-- CreateIndex
CREATE INDEX "bom_line_organizationId_componentItemId_idx" ON "bom_line"("organizationId", "componentItemId");

-- CreateIndex
CREATE INDEX "routing_organizationId_itemId_status_idx" ON "routing"("organizationId", "itemId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "routing_organizationId_code_key" ON "routing"("organizationId", "code");

-- CreateIndex
CREATE INDEX "routing_operation_organizationId_routingId_idx" ON "routing_operation"("organizationId", "routingId");

-- CreateIndex
CREATE INDEX "routing_operation_organizationId_workCenterId_idx" ON "routing_operation"("organizationId", "workCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "routing_operation_routingId_sequence_key" ON "routing_operation"("routingId", "sequence");

-- CreateIndex
CREATE INDEX "production_batch_organizationId_status_priority_idx" ON "production_batch"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "production_batch_organizationId_locationId_idx" ON "production_batch"("organizationId", "locationId");

-- CreateIndex
CREATE INDEX "production_batch_organizationId_outputItemId_idx" ON "production_batch"("organizationId", "outputItemId");

-- CreateIndex
CREATE UNIQUE INDEX "production_batch_organizationId_batchNumber_key" ON "production_batch"("organizationId", "batchNumber");

-- CreateIndex
CREATE INDEX "production_material_reservation_organizationId_productionBa_idx" ON "production_material_reservation"("organizationId", "productionBatchId");

-- CreateIndex
CREATE INDEX "production_material_reservation_organizationId_itemId_locat_idx" ON "production_material_reservation"("organizationId", "itemId", "locationId");

-- CreateIndex
CREATE INDEX "production_operation_organizationId_productionBatchId_idx" ON "production_operation"("organizationId", "productionBatchId");

-- CreateIndex
CREATE INDEX "production_operation_organizationId_workCenterId_status_idx" ON "production_operation"("organizationId", "workCenterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "production_operation_productionBatchId_sequence_key" ON "production_operation"("productionBatchId", "sequence");

-- CreateIndex
CREATE INDEX "production_time_log_organizationId_productionBatchId_idx" ON "production_time_log"("organizationId", "productionBatchId");

-- CreateIndex
CREATE INDEX "production_time_log_organizationId_productionOperationId_idx" ON "production_time_log"("organizationId", "productionOperationId");

-- CreateIndex
CREATE INDEX "production_qc_checkpoint_organizationId_productionBatchId_idx" ON "production_qc_checkpoint"("organizationId", "productionBatchId");

-- CreateIndex
CREATE INDEX "production_qc_checkpoint_organizationId_status_idx" ON "production_qc_checkpoint"("organizationId", "status");

-- CreateIndex
CREATE INDEX "production_cost_entry_organizationId_productionBatchId_cate_idx" ON "production_cost_entry"("organizationId", "productionBatchId", "category");

-- CreateIndex
CREATE INDEX "production_consumption_organizationId_productionBatchId_idx" ON "production_consumption"("organizationId", "productionBatchId");

-- CreateIndex
CREATE INDEX "production_consumption_organizationId_itemId_idx" ON "production_consumption"("organizationId", "itemId");

-- CreateIndex
CREATE INDEX "production_consumption_organizationId_stockLotId_idx" ON "production_consumption"("organizationId", "stockLotId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_revision" ADD CONSTRAINT "item_revision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_revision" ADD CONSTRAINT "item_revision_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balance" ADD CONSTRAINT "stock_balance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balance" ADD CONSTRAINT "stock_balance_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balance" ADD CONSTRAINT "stock_balance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_line" ADD CONSTRAINT "stock_transfer_line_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_line" ADD CONSTRAINT "stock_transfer_line_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "stock_transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_line" ADD CONSTRAINT "stock_transfer_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_item" ADD CONSTRAINT "supplier_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_item" ADD CONSTRAINT "supplier_item_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_item" ADD CONSTRAINT "supplier_item_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_item" ADD CONSTRAINT "supplier_item_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_line" ADD CONSTRAINT "purchase_order_line_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_line" ADD CONSTRAINT "purchase_order_line_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_line" ADD CONSTRAINT "purchase_order_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_line" ADD CONSTRAINT "purchase_order_line_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "purchase_order_line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_line" ADD CONSTRAINT "goods_receipt_line_supplierItemId_fkey" FOREIGN KEY ("supplierItemId") REFERENCES "supplier_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_lot" ADD CONSTRAINT "stock_lot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_lot" ADD CONSTRAINT "stock_lot_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_lot" ADD CONSTRAINT "stock_lot_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_lot" ADD CONSTRAINT "stock_lot_goodsReceiptLineId_fkey" FOREIGN KEY ("goodsReceiptLineId") REFERENCES "goods_receipt_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_lot" ADD CONSTRAINT "stock_lot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_lot" ADD CONSTRAINT "stock_lot_supplierItemId_fkey" FOREIGN KEY ("supplierItemId") REFERENCES "supplier_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarantine_hold" ADD CONSTRAINT "quarantine_hold_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarantine_hold" ADD CONSTRAINT "quarantine_hold_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarantine_hold" ADD CONSTRAINT "quarantine_hold_goodsReceiptLineId_fkey" FOREIGN KEY ("goodsReceiptLineId") REFERENCES "goods_receipt_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarantine_hold" ADD CONSTRAINT "quarantine_hold_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarantine_hold" ADD CONSTRAINT "quarantine_hold_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarantine_hold" ADD CONSTRAINT "quarantine_hold_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "stock_lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_claim" ADD CONSTRAINT "supplier_claim_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_claim" ADD CONSTRAINT "supplier_claim_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_claim" ADD CONSTRAINT "supplier_claim_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_claim" ADD CONSTRAINT "supplier_claim_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_claim" ADD CONSTRAINT "supplier_claim_goodsReceiptLineId_fkey" FOREIGN KEY ("goodsReceiptLineId") REFERENCES "goods_receipt_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_claim" ADD CONSTRAINT "supplier_claim_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill" ADD CONSTRAINT "vendor_bill_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill" ADD CONSTRAINT "vendor_bill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill" ADD CONSTRAINT "vendor_bill_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill" ADD CONSTRAINT "vendor_bill_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_line" ADD CONSTRAINT "vendor_bill_line_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_line" ADD CONSTRAINT "vendor_bill_line_vendorBillId_fkey" FOREIGN KEY ("vendorBillId") REFERENCES "vendor_bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_line" ADD CONSTRAINT "vendor_bill_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_line" ADD CONSTRAINT "vendor_bill_line_goodsReceiptLineId_fkey" FOREIGN KEY ("goodsReceiptLineId") REFERENCES "goods_receipt_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_object" ADD CONSTRAINT "stored_object_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachment" ADD CONSTRAINT "document_attachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachment" ADD CONSTRAINT "document_attachment_storedObjectId_fkey" FOREIGN KEY ("storedObjectId") REFERENCES "stored_object"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachment" ADD CONSTRAINT "document_attachment_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachment" ADD CONSTRAINT "document_attachment_goodsReceiptLineId_fkey" FOREIGN KEY ("goodsReceiptLineId") REFERENCES "goods_receipt_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachment" ADD CONSTRAINT "document_attachment_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "stock_lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachment" ADD CONSTRAINT "document_attachment_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "production_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachment" ADD CONSTRAINT "document_attachment_productionOperationId_fkey" FOREIGN KEY ("productionOperationId") REFERENCES "production_operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachment" ADD CONSTRAINT "document_attachment_productionQcCheckpointId_fkey" FOREIGN KEY ("productionQcCheckpointId") REFERENCES "production_qc_checkpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_leadStaffId_fkey" FOREIGN KEY ("leadStaffId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule" ADD CONSTRAINT "work_schedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_managerStaffId_fkey" FOREIGN KEY ("managerStaffId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_workScheduleId_fkey" FOREIGN KEY ("workScheduleId") REFERENCES "work_schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday" ADD CONSTRAINT "holiday_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday" ADD CONSTRAINT "holiday_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request" ADD CONSTRAINT "time_off_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request" ADD CONSTRAINT "time_off_request_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request" ADD CONSTRAINT "time_off_request_reviewedByStaffId_fkey" FOREIGN KEY ("reviewedByStaffId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_leadStaffId_fkey" FOREIGN KEY ("leadStaffId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_feed" ADD CONSTRAINT "calendar_feed_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_feed" ADD CONSTRAINT "calendar_feed_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_feed" ADD CONSTRAINT "calendar_feed_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_connection" ADD CONSTRAINT "crm_connection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_staff_mapping" ADD CONSTRAINT "crm_staff_mapping_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_staff_mapping" ADD CONSTRAINT "crm_staff_mapping_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_item_link" ADD CONSTRAINT "crm_deal_item_link_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_item_link" ADD CONSTRAINT "crm_deal_item_link_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_item_link" ADD CONSTRAINT "crm_deal_item_link_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_item_link" ADD CONSTRAINT "crm_deal_item_link_servicePlanId_fkey" FOREIGN KEY ("servicePlanId") REFERENCES "service_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_item_link" ADD CONSTRAINT "crm_deal_item_link_priceBookId_fkey" FOREIGN KEY ("priceBookId") REFERENCES "price_book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_webhook_event" ADD CONSTRAINT "crm_webhook_event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pack" ADD CONSTRAINT "item_pack_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pack" ADD CONSTRAINT "item_pack_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_bundle_component" ADD CONSTRAINT "item_bundle_component_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_bundle_component" ADD CONSTRAINT "item_bundle_component_bundleItemId_fkey" FOREIGN KEY ("bundleItemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_bundle_component" ADD CONSTRAINT "item_bundle_component_componentItemId_fkey" FOREIGN KEY ("componentItemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_bundle_component" ADD CONSTRAINT "item_bundle_component_componentPackId_fkey" FOREIGN KEY ("componentPackId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_plan" ADD CONSTRAINT "service_plan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_plan" ADD CONSTRAINT "service_plan_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_book" ADD CONSTRAINT "price_book_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_book" ADD CONSTRAINT "price_book_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_priceBookId_fkey" FOREIGN KEY ("priceBookId") REFERENCES "price_book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_servicePlanId_fkey" FOREIGN KEY ("servicePlanId") REFERENCES "service_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tier" ADD CONSTRAINT "price_tier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tier" ADD CONSTRAINT "price_tier_priceRuleId_fkey" FOREIGN KEY ("priceRuleId") REFERENCES "price_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_rule" ADD CONSTRAINT "discount_rule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_rule" ADD CONSTRAINT "discount_rule_targetItemId_fkey" FOREIGN KEY ("targetItemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_rule" ADD CONSTRAINT "discount_rule_targetPackId_fkey" FOREIGN KEY ("targetPackId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_priceBookId_fkey" FOREIGN KEY ("priceBookId") REFERENCES "price_book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_line" ADD CONSTRAINT "sales_order_line_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_line" ADD CONSTRAINT "sales_order_line_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_line" ADD CONSTRAINT "sales_order_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_line" ADD CONSTRAINT "sales_order_line_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_line" ADD CONSTRAINT "sales_order_line_servicePlanId_fkey" FOREIGN KEY ("servicePlanId") REFERENCES "service_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice" ADD CONSTRAINT "sales_invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice" ADD CONSTRAINT "sales_invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice" ADD CONSTRAINT "sales_invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_line" ADD CONSTRAINT "sales_invoice_line_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_line" ADD CONSTRAINT "sales_invoice_line_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_line" ADD CONSTRAINT "sales_invoice_line_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "sales_order_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_line" ADD CONSTRAINT "sales_invoice_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment" ADD CONSTRAINT "customer_payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment" ADD CONSTRAINT "customer_payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment" ADD CONSTRAINT "customer_payment_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment" ADD CONSTRAINT "customer_payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipt" ADD CONSTRAINT "payment_receipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipt" ADD CONSTRAINT "payment_receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "customer_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipt" ADD CONSTRAINT "payment_receipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipt" ADD CONSTRAINT "payment_receipt_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipt" ADD CONSTRAINT "payment_receipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_settings" ADD CONSTRAINT "fulfillment_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_courierStaffId_fkey" FOREIGN KEY ("courierStaffId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_job" ADD CONSTRAINT "staff_job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_job" ADD CONSTRAINT "staff_job_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "order_fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_job" ADD CONSTRAINT "staff_job_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_job" ADD CONSTRAINT "staff_job_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_job" ADD CONSTRAINT "staff_job_assignedDepartmentId_fkey" FOREIGN KEY ("assignedDepartmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_job" ADD CONSTRAINT "staff_job_assignedTeamId_fkey" FOREIGN KEY ("assignedTeamId") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_template" ADD CONSTRAINT "notification_template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notification" ADD CONSTRAINT "customer_notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notification" ADD CONSTRAINT "customer_notification_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "order_fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notification" ADD CONSTRAINT "customer_notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notification" ADD CONSTRAINT "customer_notification_staffJobId_fkey" FOREIGN KEY ("staffJobId") REFERENCES "staff_job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notification" ADD CONSTRAINT "customer_notification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_client" ADD CONSTRAINT "oauth_client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_client" ADD CONSTRAINT "oauth_client_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_client_key" ADD CONSTRAINT "oauth_client_key_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_client_key" ADD CONSTRAINT "oauth_client_key_oauthClientId_fkey" FOREIGN KEY ("oauthClientId") REFERENCES "oauth_client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_authorization_code" ADD CONSTRAINT "oauth_authorization_code_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_authorization_code" ADD CONSTRAINT "oauth_authorization_code_oauthClientId_fkey" FOREIGN KEY ("oauthClientId") REFERENCES "oauth_client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_authorization_code" ADD CONSTRAINT "oauth_authorization_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_device_code" ADD CONSTRAINT "oauth_device_code_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_device_code" ADD CONSTRAINT "oauth_device_code_oauthClientId_fkey" FOREIGN KEY ("oauthClientId") REFERENCES "oauth_client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_device_code" ADD CONSTRAINT "oauth_device_code_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_oauthClientId_fkey" FOREIGN KEY ("oauthClientId") REFERENCES "oauth_client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_registeredDeviceId_fkey" FOREIGN KEY ("registeredDeviceId") REFERENCES "registered_device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_access_token" ADD CONSTRAINT "personal_access_token_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_access_token" ADD CONSTRAINT "personal_access_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registered_device" ADD CONSTRAINT "registered_device_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registered_device" ADD CONSTRAINT "registered_device_oauthClientId_fkey" FOREIGN KEY ("oauthClientId") REFERENCES "oauth_client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registered_device" ADD CONSTRAINT "registered_device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registered_device" ADD CONSTRAINT "registered_device_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_sso_provider" ADD CONSTRAINT "organization_sso_provider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_center" ADD CONSTRAINT "work_center_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_center" ADD CONSTRAINT "work_center_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_material" ADD CONSTRAINT "bill_of_material_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_material" ADD CONSTRAINT "bill_of_material_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_material" ADD CONSTRAINT "bill_of_material_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_line" ADD CONSTRAINT "bom_line_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bill_of_material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_line" ADD CONSTRAINT "bom_line_componentItemId_fkey" FOREIGN KEY ("componentItemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_line" ADD CONSTRAINT "bom_line_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing" ADD CONSTRAINT "routing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing" ADD CONSTRAINT "routing_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_operation" ADD CONSTRAINT "routing_operation_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "routing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_operation" ADD CONSTRAINT "routing_operation_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batch" ADD CONSTRAINT "production_batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batch" ADD CONSTRAINT "production_batch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batch" ADD CONSTRAINT "production_batch_outputItemId_fkey" FOREIGN KEY ("outputItemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batch" ADD CONSTRAINT "production_batch_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bill_of_material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batch" ADD CONSTRAINT "production_batch_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "routing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batch" ADD CONSTRAINT "production_batch_parentBatchId_fkey" FOREIGN KEY ("parentBatchId") REFERENCES "production_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batch" ADD CONSTRAINT "production_batch_outputLotId_fkey" FOREIGN KEY ("outputLotId") REFERENCES "stock_lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_material_reservation" ADD CONSTRAINT "production_material_reservation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_material_reservation" ADD CONSTRAINT "production_material_reservation_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "production_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_material_reservation" ADD CONSTRAINT "production_material_reservation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_material_reservation" ADD CONSTRAINT "production_material_reservation_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_material_reservation" ADD CONSTRAINT "production_material_reservation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_material_reservation" ADD CONSTRAINT "production_material_reservation_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "stock_lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operation" ADD CONSTRAINT "production_operation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operation" ADD CONSTRAINT "production_operation_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "production_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operation" ADD CONSTRAINT "production_operation_routingOperationId_fkey" FOREIGN KEY ("routingOperationId") REFERENCES "routing_operation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operation" ADD CONSTRAINT "production_operation_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operation" ADD CONSTRAINT "production_operation_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operation" ADD CONSTRAINT "production_operation_signOffStaffId_fkey" FOREIGN KEY ("signOffStaffId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_time_log" ADD CONSTRAINT "production_time_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_time_log" ADD CONSTRAINT "production_time_log_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "production_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_time_log" ADD CONSTRAINT "production_time_log_productionOperationId_fkey" FOREIGN KEY ("productionOperationId") REFERENCES "production_operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_time_log" ADD CONSTRAINT "production_time_log_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_time_log" ADD CONSTRAINT "production_time_log_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_qc_checkpoint" ADD CONSTRAINT "production_qc_checkpoint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_qc_checkpoint" ADD CONSTRAINT "production_qc_checkpoint_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "production_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_qc_checkpoint" ADD CONSTRAINT "production_qc_checkpoint_productionOperationId_fkey" FOREIGN KEY ("productionOperationId") REFERENCES "production_operation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_qc_checkpoint" ADD CONSTRAINT "production_qc_checkpoint_conductedByUserId_fkey" FOREIGN KEY ("conductedByUserId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_qc_checkpoint" ADD CONSTRAINT "production_qc_checkpoint_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "staff_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_cost_entry" ADD CONSTRAINT "production_cost_entry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_cost_entry" ADD CONSTRAINT "production_cost_entry_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "production_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_consumption" ADD CONSTRAINT "production_consumption_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_consumption" ADD CONSTRAINT "production_consumption_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "production_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_consumption" ADD CONSTRAINT "production_consumption_productionOperationId_fkey" FOREIGN KEY ("productionOperationId") REFERENCES "production_operation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_consumption" ADD CONSTRAINT "production_consumption_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_consumption" ADD CONSTRAINT "production_consumption_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_consumption" ADD CONSTRAINT "production_consumption_packId_fkey" FOREIGN KEY ("packId") REFERENCES "item_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_consumption" ADD CONSTRAINT "production_consumption_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "stock_lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
