import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ItemStatus,
  LocationStatus,
  Prisma,
  PurchaseOrderStatus,
  StockMovementType,
  SupplierStatus,
  TenantContext,
} from "@erp/db";
import { PrismaService } from "../database/prisma.service.js";
import type { AuthenticatedTenant } from "../tenancy/tenant.decorators.js";

export interface PurchaseOrderLineInput {
  itemId: string;
  orderedQty: number;
  unitCostCents?: number;
  supplierSku?: string | null;
  description?: string | null;
}

export interface CreatePurchaseOrderInput {
  poNumber?: string;
  supplierId: string;
  locationId: string;
  currency?: string;
  taxCents?: number;
  expectedAt?: string | null;
  notes?: string | null;
  lines: PurchaseOrderLineInput[];
}

export interface UpdatePurchaseOrderInput {
  locationId?: string;
  currency?: string;
  taxCents?: number;
  expectedAt?: string | null;
  notes?: string | null;
  lines?: PurchaseOrderLineInput[];
}

export interface ListPurchaseOrdersQuery {
  status?: PurchaseOrderStatus;
  supplierId?: string;
  locationId?: string;
  search?: string;
  limit: number;
  cursor?: string;
}

export interface ReceiveGoodsInput {
  receiptNumber?: string;
  locationId?: string;
  notes?: string;
  lines: Array<{
    purchaseOrderLineId: string;
    receivedQty: number;
  }>;
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
export class PurchaseOrdersService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  async createPurchaseOrder(
    tenant: AuthenticatedTenant,
    input: CreatePurchaseOrderInput,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);
    const poNumber =
      input.poNumber?.trim().toUpperCase() ||
      `PO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    try {
      return await this.prismaService.raw.$transaction(async (tx) => {
        const [supplier, location, items, supplierItems] = await Promise.all([
          tx.supplier.findFirst({
            where: { id: input.supplierId, organizationId },
          }),
          tx.location.findFirst({
            where: { id: input.locationId, organizationId },
          }),
          tx.item.findMany({
            where: {
              organizationId,
              id: { in: input.lines.map((l) => l.itemId) },
            },
          }),
          tx.supplierItem.findMany({
            where: {
              organizationId,
              supplierId: input.supplierId,
              itemId: { in: input.lines.map((l) => l.itemId) },
            },
          }),
        ]);

        if (!supplier || supplier.status !== SupplierStatus.ACTIVE) {
          throw new BadRequestException(
            "Supplier must exist and be ACTIVE to create a purchase order.",
          );
        }
        if (!location || location.status !== LocationStatus.ACTIVE) {
          throw new BadRequestException(
            "Destination location must exist and be ACTIVE.",
          );
        }

        const itemMap = new Map(items.map((it) => [it.id, it]));
        const supplierItemMap = new Map(
          supplierItems.map((si) => [si.itemId, si]),
        );

        const builtLines = input.lines.map((line) => {
          const item = itemMap.get(line.itemId);
          if (!item) {
            throw new NotFoundException(
              `Catalog item "${line.itemId}" was not found.`,
            );
          }
          if (item.status === ItemStatus.ARCHIVED) {
            throw new BadRequestException(
              `Archived item "${item.sku}" cannot be ordered.`,
            );
          }

          const mapped = supplierItemMap.get(line.itemId);
          const unitCostCents =
            line.unitCostCents ?? mapped?.unitCostCents ?? item.costPriceCents;
          const lineTotalCents = line.orderedQty * unitCostCents;

          return {
            organizationId,
            itemId: item.id,
            supplierSku: line.supplierSku ?? mapped?.supplierSku ?? null,
            description: line.description ?? item.name,
            orderedQty: line.orderedQty,
            receivedQty: 0,
            unitCostCents,
            lineTotalCents,
          };
        });

        const subtotalCents = builtLines.reduce(
          (sum, l) => sum + l.lineTotalCents,
          0,
        );
        const taxCents = input.taxCents ?? 0;
        const totalCents = subtotalCents + taxCents;

        const created = await tx.purchaseOrder.create({
          data: {
            organizationId,
            poNumber,
            supplierId: supplier.id,
            locationId: location.id,
            status: PurchaseOrderStatus.DRAFT,
            currency: input.currency ?? supplier.currency,
            subtotalCents,
            taxCents,
            totalCents,
            notes: input.notes ?? null,
            expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
            createdByUserId: tenant.userId,
            updatedByUserId: tenant.userId,
            lines: { create: builtLines },
          },
          include: {
            supplier: { select: { id: true, code: true, name: true } },
            location: { select: { id: true, code: true, name: true, type: true } },
            lines: {
              include: {
                item: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    type: true,
                    unitOfMeasure: true,
                  },
                },
              },
            },
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            actorUserId: tenant.userId,
            action: "purchase_order.created",
            resourceType: "PurchaseOrder",
            resourceId: created.id,
            metadata: {
              poNumber: created.poNumber,
              supplierCode: supplier.code,
              locationCode: location.code,
              totalCents: created.totalCents,
              lineCount: created.lines.length,
            } as Prisma.InputJsonValue,
            ipAddress: ipAddress ?? null,
          },
        });

        return created;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          `Purchase order number "${poNumber}" already exists in this organization.`,
        );
      }
      throw error;
    }
  }

  async listPurchaseOrders(
    tenant: AuthenticatedTenant,
    query: ListPurchaseOrdersQuery,
  ) {
    this.resolveVerifiedOrganizationId(tenant);
    const take = Math.min(Math.max(query.limit, 1), 100);
    const search = query.search?.trim();

    const records = await this.prismaService.scoped.purchaseOrder.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {}),
        ...(query.locationId ? { locationId: query.locationId } : {}),
        ...(search
          ? { poNumber: { contains: search, mode: "insensitive" } }
          : {}),
      },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true, type: true } },
      },
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const hasMore = records.length > take;
    const items = hasMore ? records.slice(0, take) : records;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return {
      organizationId: tenant.organizationId,
      items,
      nextCursor,
    };
  }

  async getPurchaseOrder(tenant: AuthenticatedTenant, poId: string) {
    this.resolveVerifiedOrganizationId(tenant);

    const po = await this.prismaService.scoped.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: { select: { id: true, code: true, name: true, email: true } },
        location: { select: { id: true, code: true, name: true, type: true } },
        lines: {
          include: {
            item: {
              select: {
                id: true,
                sku: true,
                name: true,
                type: true,
                unitOfMeasure: true,
                trackInventory: true,
              },
            },
          },
        },
        goodsReceipts: {
          orderBy: { receivedAt: "desc" },
          include: { lines: true },
        },
      },
    });

    if (!po) {
      throw new NotFoundException("Purchase order was not found.");
    }

    return po;
  }

  async updateDraftPurchaseOrder(
    tenant: AuthenticatedTenant,
    poId: string,
    input: UpdatePurchaseOrderInput,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    return this.prismaService.raw.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id: poId, organizationId },
        include: { lines: true },
      });

      if (!existing) {
        throw new NotFoundException("Purchase order was not found.");
      }

      if (existing.status !== PurchaseOrderStatus.DRAFT) {
        throw new BadRequestException(
          "Only DRAFT purchase orders can be edited.",
        );
      }

      if (input.locationId) {
        const loc = await tx.location.findFirst({
          where: { id: input.locationId, organizationId },
        });
        if (!loc || loc.status !== LocationStatus.ACTIVE) {
          throw new BadRequestException(
            "Destination location must exist and be ACTIVE.",
          );
        }
      }

      let subtotalCents = existing.subtotalCents;
      const taxCents = input.taxCents ?? existing.taxCents;

      if (input.lines) {
        const [items, supplierItems] = await Promise.all([
          tx.item.findMany({
            where: {
              organizationId,
              id: { in: input.lines.map((l) => l.itemId) },
            },
          }),
          tx.supplierItem.findMany({
            where: {
              organizationId,
              supplierId: existing.supplierId,
              itemId: { in: input.lines.map((l) => l.itemId) },
            },
          }),
        ]);

        const itemMap = new Map(items.map((it) => [it.id, it]));
        const supplierItemMap = new Map(
          supplierItems.map((si) => [si.itemId, si]),
        );

        const rebuiltLines = input.lines.map((line) => {
          const item = itemMap.get(line.itemId);
          if (!item) {
            throw new NotFoundException(
              `Catalog item "${line.itemId}" was not found.`,
            );
          }
          if (item.status === ItemStatus.ARCHIVED) {
            throw new BadRequestException(
              `Archived item "${item.sku}" cannot be ordered.`,
            );
          }
          const mapped = supplierItemMap.get(line.itemId);
          const unitCostCents =
            line.unitCostCents ?? mapped?.unitCostCents ?? item.costPriceCents;
          return {
            organizationId,
            purchaseOrderId: poId,
            itemId: item.id,
            supplierSku: line.supplierSku ?? mapped?.supplierSku ?? null,
            description: line.description ?? item.name,
            orderedQty: line.orderedQty,
            receivedQty: 0,
            unitCostCents,
            lineTotalCents: line.orderedQty * unitCostCents,
          };
        });

        await tx.purchaseOrderLine.deleteMany({
          where: { organizationId, purchaseOrderId: poId },
        });
        await tx.purchaseOrderLine.createMany({ data: rebuiltLines });
        subtotalCents = rebuiltLines.reduce(
          (sum, l) => sum + l.lineTotalCents,
          0,
        );
      }

      const totalCents = subtotalCents + taxCents;

      const updated = await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          ...(input.locationId !== undefined
            ? { locationId: input.locationId }
            : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.taxCents !== undefined ? { taxCents } : {}),
          ...(input.expectedAt !== undefined
            ? {
                expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
              }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          subtotalCents,
          totalCents,
          updatedByUserId: tenant.userId,
        },
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          location: { select: { id: true, code: true, name: true, type: true } },
          lines: {
            include: {
              item: {
                select: { id: true, sku: true, name: true, unitOfMeasure: true },
              },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "purchase_order.updated",
          resourceType: "PurchaseOrder",
          resourceId: updated.id,
          metadata: {
            poNumber: updated.poNumber,
            totalCents: updated.totalCents,
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return updated;
    });
  }

  async submitPurchaseOrder(
    tenant: AuthenticatedTenant,
    poId: string,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    return this.prismaService.raw.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id: poId, organizationId },
        include: { lines: true },
      });

      if (!existing) {
        throw new NotFoundException("Purchase order was not found.");
      }
      if (existing.status !== PurchaseOrderStatus.DRAFT) {
        throw new BadRequestException(
          `Only DRAFT purchase orders can be submitted (current status: ${existing.status}).`,
        );
      }
      if (existing.lines.length === 0) {
        throw new BadRequestException(
          "Purchase order must contain at least one line before submission.",
        );
      }

      const claimed = await tx.purchaseOrder.updateMany({
        where: {
          id: poId,
          organizationId,
          status: PurchaseOrderStatus.DRAFT,
        },
        data: {
          status: PurchaseOrderStatus.SUBMITTED,
          submittedAt: new Date(),
          submittedByUserId: tenant.userId,
          updatedByUserId: tenant.userId,
        },
      });

      if (claimed.count !== 1) {
        throw new ConflictException(
          "Purchase order state changed concurrently. Refresh and retry.",
        );
      }

      const submitted = await tx.purchaseOrder.findFirstOrThrow({
        where: { id: poId, organizationId },
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          location: { select: { id: true, code: true, name: true, type: true } },
          lines: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "purchase_order.submitted",
          resourceType: "PurchaseOrder",
          resourceId: submitted.id,
          metadata: {
            poNumber: submitted.poNumber,
            totalCents: submitted.totalCents,
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return submitted;
    });
  }

  async cancelPurchaseOrder(
    tenant: AuthenticatedTenant,
    poId: string,
    reason?: string,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    return this.prismaService.raw.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id: poId, organizationId },
        include: { lines: true },
      });

      if (!existing) {
        throw new NotFoundException("Purchase order was not found.");
      }

      if (
        existing.status !== PurchaseOrderStatus.DRAFT &&
        existing.status !== PurchaseOrderStatus.SUBMITTED
      ) {
        throw new BadRequestException(
          `Purchase orders in status "${existing.status}" cannot be cancelled.`,
        );
      }

      const hasReceivedItems = existing.lines.some((l) => l.receivedQty > 0);
      if (hasReceivedItems) {
        throw new BadRequestException(
          "Cannot cancel a purchase order that already has received goods.",
        );
      }

      const claimed = await tx.purchaseOrder.updateMany({
        where: { id: poId, organizationId, status: existing.status },
        data: {
          status: PurchaseOrderStatus.CANCELLED,
          cancelledAt: new Date(),
          updatedByUserId: tenant.userId,
        },
      });

      if (claimed.count !== 1) {
        throw new ConflictException(
          "Purchase order state changed concurrently. Refresh and retry.",
        );
      }

      const cancelled = await tx.purchaseOrder.findFirstOrThrow({
        where: { id: poId, organizationId },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "purchase_order.cancelled",
          resourceType: "PurchaseOrder",
          resourceId: cancelled.id,
          metadata: {
            poNumber: cancelled.poNumber,
            previousStatus: existing.status,
            ...(reason ? { reason } : {}),
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return cancelled;
    });
  }

  async receiveGoods(
    tenant: AuthenticatedTenant,
    poId: string,
    input: ReceiveGoodsInput,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);
    const receiptNumber =
      input.receiptNumber?.trim().toUpperCase() ||
      `GRN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    try {
      return await this.prismaService.raw.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.findFirst({
          where: { id: poId, organizationId },
          include: {
            lines: { include: { item: true } },
            supplier: true,
          },
        });

        if (!po) {
          throw new NotFoundException("Purchase order was not found.");
        }

        if (
          po.status !== PurchaseOrderStatus.SUBMITTED &&
          po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
        ) {
          throw new BadRequestException(
            `Purchase order must be SUBMITTED or PARTIALLY_RECEIVED to receive goods (current status: ${po.status}).`,
          );
        }

        const receivingLocationId = input.locationId ?? po.locationId;
        const location = await tx.location.findFirst({
          where: { id: receivingLocationId, organizationId },
        });
        if (!location || location.status !== LocationStatus.ACTIVE) {
          throw new BadRequestException(
            "Receiving location must exist and be ACTIVE.",
          );
        }

        const lineMap = new Map(po.lines.map((l) => [l.id, l]));
        const qtyByLine = new Map<string, number>();
        for (const reqLine of input.lines) {
          qtyByLine.set(
            reqLine.purchaseOrderLineId,
            (qtyByLine.get(reqLine.purchaseOrderLineId) ?? 0) +
              reqLine.receivedQty,
          );
        }

        const receiptLinesData: Array<{
          organizationId: string;
          purchaseOrderLineId: string;
          itemId: string;
          receivedQty: number;
          unitCostCents: number;
        }> = [];

        for (const [poLineId, qty] of qtyByLine.entries()) {
          const poLine = lineMap.get(poLineId);
          if (!poLine) {
            throw new NotFoundException(
              `Purchase order line "${poLineId}" does not belong to this purchase order.`,
            );
          }

          const remaining = poLine.orderedQty - poLine.receivedQty;
          if (qty > remaining) {
            throw new BadRequestException(
              `Cannot receive ${qty} units for SKU "${poLine.item.sku}" (remaining open quantity: ${remaining}).`,
            );
          }

          receiptLinesData.push({
            organizationId,
            purchaseOrderLineId: poLine.id,
            itemId: poLine.itemId,
            receivedQty: qty,
            unitCostCents: poLine.unitCostCents,
          });
        }

        const receipt = await tx.goodsReceipt.create({
          data: {
            organizationId,
            receiptNumber,
            purchaseOrderId: po.id,
            locationId: location.id,
            notes: input.notes ?? null,
            receivedByUserId: tenant.userId,
            lines: { create: receiptLinesData },
          },
          include: {
            location: { select: { id: true, code: true, name: true, type: true } },
            lines: {
              include: {
                item: {
                  select: { id: true, sku: true, name: true, unitOfMeasure: true },
                },
              },
            },
          },
        });

        for (const rLine of receiptLinesData) {
          const poLine = lineMap.get(rLine.purchaseOrderLineId)!;
          await tx.purchaseOrderLine.update({
            where: { id: poLine.id },
            data: { receivedQty: { increment: rLine.receivedQty } },
          });

          if (poLine.item.trackInventory) {
            const bal = await tx.stockBalance.upsert({
              where: {
                organizationId_itemId_locationId: {
                  organizationId,
                  itemId: rLine.itemId,
                  locationId: location.id,
                },
              },
              create: {
                organizationId,
                itemId: rLine.itemId,
                locationId: location.id,
                onHandQty: rLine.receivedQty,
                reservedQty: 0,
              },
              update: {
                onHandQty: { increment: rLine.receivedQty },
              },
            });

            await tx.stockMovement.create({
              data: {
                organizationId,
                itemId: rLine.itemId,
                locationId: location.id,
                type: StockMovementType.RECEIPT,
                quantityDelta: rLine.receivedQty,
                balanceAfter: bal.onHandQty,
                referenceType: "GoodsReceipt",
                referenceId: receipt.id,
                reason: `Received against PO ${po.poNumber} (${receipt.receiptNumber})`,
                actorUserId: tenant.userId,
              },
            });
          }
        }

        const updatedLines = await tx.purchaseOrderLine.findMany({
          where: { organizationId, purchaseOrderId: po.id },
        });
        const allReceived = updatedLines.every(
          (l) => l.receivedQty >= l.orderedQty,
        );
        const nextPoStatus = allReceived
          ? PurchaseOrderStatus.RECEIVED
          : PurchaseOrderStatus.PARTIALLY_RECEIVED;

        const updatedPo = await tx.purchaseOrder.update({
          where: { id: po.id },
          data: {
            status: nextPoStatus,
            updatedByUserId: tenant.userId,
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            actorUserId: tenant.userId,
            action: "goods_receipt.created",
            resourceType: "GoodsReceipt",
            resourceId: receipt.id,
            metadata: {
              receiptNumber: receipt.receiptNumber,
              purchaseOrderId: po.id,
              poNumber: po.poNumber,
              locationCode: location.code,
              nextPoStatus,
              lineCount: receiptLinesData.length,
            } as Prisma.InputJsonValue,
            ipAddress: ipAddress ?? null,
          },
        });

        return {
          receipt,
          purchaseOrder: updatedPo,
        };
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          `Goods receipt number "${receiptNumber}" already exists in this organization.`,
        );
      }
      throw error;
    }
  }

  private resolveVerifiedOrganizationId(tenant: AuthenticatedTenant): string {
    const contextOrgId = TenantContext.getOrganizationId();
    if (contextOrgId && contextOrgId !== tenant.organizationId) {
      throw new BadRequestException("Active tenant context mismatch.");
    }
    return tenant.organizationId;
  }
}
