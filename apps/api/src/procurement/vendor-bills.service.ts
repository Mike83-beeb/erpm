import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, SupplierStatus, TenantContext, VendorBillStatus } from "@scace/db";
import { PrismaService } from "../database/prisma.service.js";
import type { AuthenticatedTenant } from "../tenancy/tenant.decorators.js";

export interface CreateVendorBillInput {
  billNumber: string;
  supplierId: string;
  purchaseOrderId?: string | null;
  goodsReceiptId?: string | null;
  status?: "DRAFT" | "OPEN";
  currency?: string;
  taxCents?: number;
  issuedAt?: string;
  dueAt?: string | null;
  notes?: string | null;
  lines: Array<{
    itemId?: string | null;
    description: string;
    quantity: number;
    unitCostCents: number;
  }>;
}

export interface ListVendorBillsQuery {
  status?: VendorBillStatus;
  supplierId?: string;
  purchaseOrderId?: string;
  search?: string;
  limit: number;
  cursor?: string;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

@Injectable()
export class VendorBillsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  async createVendorBill(
    tenant: AuthenticatedTenant,
    input: CreateVendorBillInput,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);
    const billNumber = input.billNumber.trim();

    try {
      return await this.prismaService.raw.$transaction(async (tx) => {
        const supplier = await tx.supplier.findFirst({
          where: { id: input.supplierId, organizationId },
        });
        if (!supplier || supplier.status === SupplierStatus.ARCHIVED) {
          throw new BadRequestException(
            "Supplier must exist and not be archived.",
          );
        }

        if (input.purchaseOrderId) {
          const po = await tx.purchaseOrder.findFirst({
            where: { id: input.purchaseOrderId, organizationId },
          });
          if (!po) {
            throw new NotFoundException("Linked purchase order was not found.");
          }
          if (po.supplierId !== supplier.id) {
            throw new BadRequestException(
              "Linked purchase order belongs to a different supplier.",
            );
          }
        }

        if (input.goodsReceiptId) {
          const receipt = await tx.goodsReceipt.findFirst({
            where: { id: input.goodsReceiptId, organizationId },
            include: { purchaseOrder: true },
          });
          if (!receipt) {
            throw new NotFoundException("Linked goods receipt was not found.");
          }
          if (receipt.purchaseOrder.supplierId !== supplier.id) {
            throw new BadRequestException(
              "Linked goods receipt belongs to a different supplier.",
            );
          }
          if (
            input.purchaseOrderId &&
            receipt.purchaseOrderId !== input.purchaseOrderId
          ) {
            throw new BadRequestException(
              "Linked goods receipt does not match the specified purchase order.",
            );
          }
        }

        const itemIds = input.lines
          .map((l) => l.itemId)
          .filter((id): id is string => Boolean(id));
        if (itemIds.length > 0) {
          const foundItems = await tx.item.findMany({
            where: { organizationId, id: { in: itemIds } },
            select: { id: true },
          });
          const foundSet = new Set(foundItems.map((i) => i.id));
          for (const id of itemIds) {
            if (!foundSet.has(id)) {
              throw new NotFoundException(`Catalog item "${id}" was not found.`);
            }
          }
        }

        const builtLines = input.lines.map((line) => ({
          organizationId,
          itemId: line.itemId ?? null,
          description: line.description.trim(),
          quantity: line.quantity,
          unitCostCents: line.unitCostCents,
          lineTotalCents: line.quantity * line.unitCostCents,
        }));

        const subtotalCents = builtLines.reduce(
          (sum, l) => sum + l.lineTotalCents,
          0,
        );
        const taxCents = input.taxCents ?? 0;
        const totalCents = subtotalCents + taxCents;

        const issuedAt = input.issuedAt ? new Date(input.issuedAt) : new Date();
        const dueAt = input.dueAt
          ? new Date(input.dueAt)
          : new Date(
              issuedAt.getTime() + supplier.paymentTermsDays * 86_400_000,
            );

        const created = await tx.vendorBill.create({
          data: {
            organizationId,
            billNumber,
            supplierId: supplier.id,
            purchaseOrderId: input.purchaseOrderId ?? null,
            goodsReceiptId: input.goodsReceiptId ?? null,
            status: input.status ?? VendorBillStatus.OPEN,
            currency: input.currency ?? supplier.currency,
            subtotalCents,
            taxCents,
            totalCents,
            paidAmountCents: 0,
            issuedAt,
            dueAt,
            notes: input.notes ?? null,
            createdByUserId: tenant.userId,
            updatedByUserId: tenant.userId,
            lines: { create: builtLines },
          },
          include: {
            supplier: { select: { id: true, code: true, name: true } },
            lines: true,
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            actorUserId: tenant.userId,
            action: "vendor_bill.created",
            resourceType: "VendorBill",
            resourceId: created.id,
            metadata: {
              billNumber: created.billNumber,
              supplierCode: supplier.code,
              status: created.status,
              totalCents: created.totalCents,
            } as Prisma.InputJsonValue,
            ipAddress: ipAddress ?? null,
          },
        });

        return created;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          `Bill number "${billNumber}" already exists for this supplier.`,
        );
      }
      throw error;
    }
  }

  async listVendorBills(
    tenant: AuthenticatedTenant,
    query: ListVendorBillsQuery,
  ) {
    this.resolveVerifiedOrganizationId(tenant);
    const take = Math.min(Math.max(query.limit, 1), 100);
    const search = query.search?.trim();

    const records = await this.prismaService.scoped.vendorBill.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {}),
        ...(query.purchaseOrderId
          ? { purchaseOrderId: query.purchaseOrderId }
          : {}),
        ...(search
          ? { billNumber: { contains: search, mode: "insensitive" } }
          : {}),
      },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
      },
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ issuedAt: "desc" }, { id: "desc" }],
    });

    const hasMore = records.length > take;
    const items = hasMore ? records.slice(0, take) : records;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return {
      organizationId: tenant.organizationId,
      items: items.map((b) => ({
        ...b,
        balanceDueCents: Math.max(0, b.totalCents - b.paidAmountCents),
      })),
      nextCursor,
    };
  }

  async getVendorBill(tenant: AuthenticatedTenant, billId: string) {
    this.resolveVerifiedOrganizationId(tenant);

    const bill = await this.prismaService.scoped.vendorBill.findUnique({
      where: { id: billId },
      include: {
        supplier: { select: { id: true, code: true, name: true, email: true } },
        purchaseOrder: { select: { id: true, poNumber: true, status: true } },
        goodsReceipt: { select: { id: true, receiptNumber: true } },
        lines: {
          include: {
            item: { select: { id: true, sku: true, name: true } },
          },
        },
      },
    });

    if (!bill) {
      throw new NotFoundException("Vendor bill was not found.");
    }

    return {
      ...bill,
      balanceDueCents: Math.max(0, bill.totalCents - bill.paidAmountCents),
    };
  }

  async postVendorBill(
    tenant: AuthenticatedTenant,
    billId: string,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    return this.prismaService.raw.$transaction(async (tx) => {
      const existing = await tx.vendorBill.findFirst({
        where: { id: billId, organizationId },
      });

      if (!existing) {
        throw new NotFoundException("Vendor bill was not found.");
      }
      if (existing.status !== VendorBillStatus.DRAFT) {
        throw new BadRequestException(
          `Only DRAFT vendor bills can be posted (current status: ${existing.status}).`,
        );
      }

      const claimed = await tx.vendorBill.updateMany({
        where: { id: billId, organizationId, status: VendorBillStatus.DRAFT },
        data: {
          status: VendorBillStatus.OPEN,
          updatedByUserId: tenant.userId,
        },
      });

      if (claimed.count !== 1) {
        throw new ConflictException(
          "Vendor bill state changed concurrently. Refresh and retry.",
        );
      }

      const posted = await tx.vendorBill.findFirstOrThrow({
        where: { id: billId, organizationId },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "vendor_bill.posted",
          resourceType: "VendorBill",
          resourceId: posted.id,
          metadata: {
            billNumber: posted.billNumber,
            totalCents: posted.totalCents,
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return posted;
    });
  }

  async recordPayment(
    tenant: AuthenticatedTenant,
    billId: string,
    amountCents: number,
    reference?: string,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    return this.prismaService.raw.$transaction(async (tx) => {
      const existing = await tx.vendorBill.findFirst({
        where: { id: billId, organizationId },
      });

      if (!existing) {
        throw new NotFoundException("Vendor bill was not found.");
      }

      if (
        existing.status !== VendorBillStatus.OPEN &&
        existing.status !== VendorBillStatus.PARTIALLY_PAID
      ) {
        throw new BadRequestException(
          `Payments can only be recorded on OPEN or PARTIALLY_PAID bills (current status: ${existing.status}).`,
        );
      }

      const remainingCents = existing.totalCents - existing.paidAmountCents;
      if (amountCents > remainingCents) {
        throw new BadRequestException(
          `Payment amount (${amountCents}) exceeds remaining balance due (${remainingCents}).`,
        );
      }

      const nextPaidAmount = existing.paidAmountCents + amountCents;
      const nextStatus =
        nextPaidAmount >= existing.totalCents
          ? VendorBillStatus.PAID
          : VendorBillStatus.PARTIALLY_PAID;

      const claimed = await tx.vendorBill.updateMany({
        where: {
          id: billId,
          organizationId,
          paidAmountCents: existing.paidAmountCents,
        },
        data: {
          paidAmountCents: nextPaidAmount,
          status: nextStatus,
          ...(nextStatus === VendorBillStatus.PAID ? { paidAt: new Date() } : {}),
          updatedByUserId: tenant.userId,
        },
      });

      if (claimed.count !== 1) {
        throw new ConflictException(
          "Vendor bill balance changed concurrently. Refresh and retry.",
        );
      }

      const updated = await tx.vendorBill.findFirstOrThrow({
        where: { id: billId, organizationId },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "vendor_bill.payment_recorded",
          resourceType: "VendorBill",
          resourceId: updated.id,
          metadata: {
            billNumber: updated.billNumber,
            amountCents,
            paidAmountCents: updated.paidAmountCents,
            totalCents: updated.totalCents,
            status: updated.status,
            ...(reference ? { reference } : {}),
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return {
        ...updated,
        balanceDueCents: Math.max(
          0,
          updated.totalCents - updated.paidAmountCents,
        ),
      };
    });
  }

  async voidVendorBill(
    tenant: AuthenticatedTenant,
    billId: string,
    reason?: string,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    return this.prismaService.raw.$transaction(async (tx) => {
      const existing = await tx.vendorBill.findFirst({
        where: { id: billId, organizationId },
      });

      if (!existing) {
        throw new NotFoundException("Vendor bill was not found.");
      }
      if (existing.status === VendorBillStatus.VOID) {
        throw new BadRequestException("Vendor bill is already voided.");
      }
      if (existing.paidAmountCents > 0) {
        throw new BadRequestException(
          "Cannot void a vendor bill that has recorded payments.",
        );
      }

      const claimed = await tx.vendorBill.updateMany({
        where: {
          id: billId,
          organizationId,
          status: existing.status,
          paidAmountCents: 0,
        },
        data: {
          status: VendorBillStatus.VOID,
          voidedAt: new Date(),
          updatedByUserId: tenant.userId,
        },
      });

      if (claimed.count !== 1) {
        throw new ConflictException(
          "Vendor bill state changed concurrently. Refresh and retry.",
        );
      }

      const voided = await tx.vendorBill.findFirstOrThrow({
        where: { id: billId, organizationId },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "vendor_bill.voided",
          resourceType: "VendorBill",
          resourceId: voided.id,
          metadata: {
            billNumber: voided.billNumber,
            previousStatus: existing.status,
            ...(reason ? { reason } : {}),
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return voided;
    });
  }

  private resolveVerifiedOrganizationId(tenant: AuthenticatedTenant): string {
    const contextOrgId = TenantContext.getOrganizationId();
    if (contextOrgId && contextOrgId !== tenant.organizationId) {
      throw new BadRequestException("Active tenant context mismatch.");
    }
    return tenant.organizationId;
  }
}
