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
  StockMovementType,
  StockTransferStatus,
  TenantContext,
} from "@scace/db";
import { PrismaService } from "../database/prisma.service.js";
import type { AuthenticatedTenant } from "../tenancy/tenant.decorators.js";

export interface ListBalancesQuery {
  locationId?: string;
  itemId?: string;
  lowStockOnly?: boolean;
  limit: number;
  cursor?: string;
}

export interface ListMovementsQuery {
  locationId?: string;
  itemId?: string;
  type?: StockMovementType;
  limit: number;
  cursor?: string;
}

export interface AdjustStockInput {
  itemId: string;
  locationId: string;
  quantityDelta: number;
  reason: string;
}

export interface CreateTransferInput {
  transferNumber?: string;
  fromLocationId: string;
  toLocationId: string;
  notes?: string;
  lines: Array<{ itemId: string; quantity: number }>;
}

export interface ListTransfersQuery {
  status?: StockTransferStatus;
  fromLocationId?: string;
  toLocationId?: string;
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
export class InventoryService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  async listBalances(tenant: AuthenticatedTenant, query: ListBalancesQuery) {
    this.resolveVerifiedOrganizationId(tenant);
    const take = Math.min(Math.max(query.limit, 1), 100);

    const records = await this.prismaService.scoped.stockBalance.findMany({
      where: {
        ...(query.locationId ? { locationId: query.locationId } : {}),
        ...(query.itemId ? { itemId: query.itemId } : {}),
      },
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
            type: true,
            status: true,
            unitOfMeasure: true,
            reorderPoint: true,
            trackInventory: true,
            allowNegativeStock: true,
          },
        },
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            status: true,
          },
        },
      },
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    const filtered = query.lowStockOnly
      ? records.filter(
          (row) =>
            row.item.reorderPoint !== null &&
            row.onHandQty <= row.item.reorderPoint,
        )
      : records;

    const hasMore = filtered.length > take;
    const sliced = hasMore ? filtered.slice(0, take) : filtered;
    const nextCursor = hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null;

    return {
      organizationId: tenant.organizationId,
      items: sliced.map((row) => ({
        ...row,
        availableQty: row.onHandQty - row.reservedQty,
      })),
      nextCursor,
    };
  }

  async listMovements(tenant: AuthenticatedTenant, query: ListMovementsQuery) {
    this.resolveVerifiedOrganizationId(tenant);
    const take = Math.min(Math.max(query.limit, 1), 100);

    const records = await this.prismaService.scoped.stockMovement.findMany({
      where: {
        ...(query.locationId ? { locationId: query.locationId } : {}),
        ...(query.itemId ? { itemId: query.itemId } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      include: {
        item: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
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

  async adjustStock(
    tenant: AuthenticatedTenant,
    input: AdjustStockInput,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    if (input.quantityDelta === 0) {
      throw new BadRequestException("quantityDelta must be a non-zero integer.");
    }

    return this.prismaService.raw.$transaction(async (tx) => {
      const [item, location] = await Promise.all([
        tx.item.findFirst({
          where: { id: input.itemId, organizationId },
        }),
        tx.location.findFirst({
          where: { id: input.locationId, organizationId },
        }),
      ]);

      if (!item) {
        throw new NotFoundException("Catalog item was not found.");
      }
      if (item.status === ItemStatus.ARCHIVED) {
        throw new BadRequestException(
          "Cannot adjust stock for an archived catalog item.",
        );
      }
      if (!item.trackInventory) {
        throw new BadRequestException(
          `Item "${item.sku}" has trackInventory disabled and cannot hold stock.`,
        );
      }
      if (!location) {
        throw new NotFoundException("Location was not found.");
      }
      if (location.status !== LocationStatus.ACTIVE) {
        throw new BadRequestException(
          "Stock adjustments are only allowed on ACTIVE locations.",
        );
      }

      const existingBalance = await tx.stockBalance.findUnique({
        where: {
          organizationId_itemId_locationId: {
            organizationId,
            itemId: item.id,
            locationId: location.id,
          },
        },
      });

      const currentQty = existingBalance?.onHandQty ?? 0;
      const nextQty = currentQty + input.quantityDelta;

      if (nextQty < 0 && !item.allowNegativeStock) {
        throw new BadRequestException(
          `Insufficient stock for SKU "${item.sku}" at location "${location.code}" (on hand: ${currentQty}, delta: ${input.quantityDelta}).`,
        );
      }

      const balance = existingBalance
        ? await tx.stockBalance.update({
            where: { id: existingBalance.id },
            data: { onHandQty: nextQty },
          })
        : await tx.stockBalance.create({
            data: {
              organizationId,
              itemId: item.id,
              locationId: location.id,
              onHandQty: nextQty,
              reservedQty: 0,
            },
          });

      const movement = await tx.stockMovement.create({
        data: {
          organizationId,
          itemId: item.id,
          locationId: location.id,
          type: StockMovementType.ADJUSTMENT,
          quantityDelta: input.quantityDelta,
          balanceAfter: balance.onHandQty,
          referenceType: "ManualAdjustment",
          reason: input.reason,
          actorUserId: tenant.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "inventory.adjusted",
          resourceType: "StockBalance",
          resourceId: balance.id,
          metadata: {
            itemId: item.id,
            sku: item.sku,
            locationId: location.id,
            locationCode: location.code,
            quantityDelta: input.quantityDelta,
            previousQty: currentQty,
            balanceAfter: balance.onHandQty,
            reason: input.reason,
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return {
        balance: {
          ...balance,
          availableQty: balance.onHandQty - balance.reservedQty,
        },
        movement,
      };
    });
  }

  async createTransfer(
    tenant: AuthenticatedTenant,
    input: CreateTransferInput,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    if (input.fromLocationId === input.toLocationId) {
      throw new BadRequestException(
        "Source and destination locations must be different.",
      );
    }

    const dedupedLines = new Map<string, number>();
    for (const line of input.lines) {
      dedupedLines.set(
        line.itemId,
        (dedupedLines.get(line.itemId) ?? 0) + line.quantity,
      );
    }

    const transferNumber =
      input.transferNumber?.trim().toUpperCase() ||
      `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    try {
      return await this.prismaService.raw.$transaction(async (tx) => {
        const [fromLoc, toLoc, items] = await Promise.all([
          tx.location.findFirst({
            where: { id: input.fromLocationId, organizationId },
          }),
          tx.location.findFirst({
            where: { id: input.toLocationId, organizationId },
          }),
          tx.item.findMany({
            where: {
              organizationId,
              id: { in: Array.from(dedupedLines.keys()) },
            },
          }),
        ]);

        if (!fromLoc || fromLoc.status !== LocationStatus.ACTIVE) {
          throw new BadRequestException(
            "Source location must exist and be ACTIVE.",
          );
        }
        if (!toLoc || toLoc.status !== LocationStatus.ACTIVE) {
          throw new BadRequestException(
            "Destination location must exist and be ACTIVE.",
          );
        }

        const itemMap = new Map(items.map((it) => [it.id, it]));
        for (const itemId of dedupedLines.keys()) {
          const item = itemMap.get(itemId);
          if (!item) {
            throw new NotFoundException(`Catalog item "${itemId}" not found.`);
          }
          if (item.status === ItemStatus.ARCHIVED) {
            throw new BadRequestException(
              `Archived item "${item.sku}" cannot be transferred.`,
            );
          }
          if (!item.trackInventory) {
            throw new BadRequestException(
              `Item "${item.sku}" has trackInventory disabled and cannot be transferred.`,
            );
          }
        }

        const transfer = await tx.stockTransfer.create({
          data: {
            organizationId,
            transferNumber,
            fromLocationId: fromLoc.id,
            toLocationId: toLoc.id,
            status: StockTransferStatus.DRAFT,
            notes: input.notes ?? null,
            createdByUserId: tenant.userId,
            lines: {
              create: Array.from(dedupedLines.entries()).map(
                ([itemId, quantity]) => ({
                  organizationId,
                  itemId,
                  quantity,
                }),
              ),
            },
          },
          include: {
            fromLocation: {
              select: { id: true, code: true, name: true, type: true },
            },
            toLocation: {
              select: { id: true, code: true, name: true, type: true },
            },
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
            action: "inventory.transfer.created",
            resourceType: "StockTransfer",
            resourceId: transfer.id,
            metadata: {
              transferNumber: transfer.transferNumber,
              fromLocationCode: fromLoc.code,
              toLocationCode: toLoc.code,
              lineCount: transfer.lines.length,
            } as Prisma.InputJsonValue,
            ipAddress: ipAddress ?? null,
          },
        });

        return transfer;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          `Transfer number "${transferNumber}" already exists in this organization.`,
        );
      }
      throw error;
    }
  }

  async listTransfers(
    tenant: AuthenticatedTenant,
    query: ListTransfersQuery,
  ) {
    this.resolveVerifiedOrganizationId(tenant);
    const take = Math.min(Math.max(query.limit, 1), 100);

    const records = await this.prismaService.scoped.stockTransfer.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.fromLocationId
          ? { fromLocationId: query.fromLocationId }
          : {}),
        ...(query.toLocationId ? { toLocationId: query.toLocationId } : {}),
      },
      include: {
        fromLocation: { select: { id: true, code: true, name: true, type: true } },
        toLocation: { select: { id: true, code: true, name: true, type: true } },
        lines: {
          include: {
            item: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
          },
        },
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

  async getTransfer(tenant: AuthenticatedTenant, transferId: string) {
    this.resolveVerifiedOrganizationId(tenant);

    const transfer = await this.prismaService.scoped.stockTransfer.findUnique({
      where: { id: transferId },
      include: {
        fromLocation: { select: { id: true, code: true, name: true, type: true } },
        toLocation: { select: { id: true, code: true, name: true, type: true } },
        lines: {
          include: {
            item: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException("Stock transfer was not found.");
    }

    return transfer;
  }

  async dispatchTransfer(
    tenant: AuthenticatedTenant,
    transferId: string,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    return this.prismaService.raw.$transaction(async (tx) => {
      const existing = await tx.stockTransfer.findFirst({
        where: { id: transferId, organizationId },
        include: {
          fromLocation: true,
          toLocation: true,
          lines: { include: { item: true } },
        },
      });

      if (!existing) {
        throw new NotFoundException("Stock transfer was not found.");
      }

      if (existing.status !== StockTransferStatus.DRAFT) {
        throw new BadRequestException(
          `Only DRAFT transfers can be dispatched (current status: ${existing.status}).`,
        );
      }

      if (existing.fromLocation.status !== LocationStatus.ACTIVE) {
        throw new BadRequestException("Source location must be ACTIVE to dispatch.");
      }

      const claimed = await tx.stockTransfer.updateMany({
        where: {
          id: transferId,
          organizationId,
          status: StockTransferStatus.DRAFT,
        },
        data: {
          status: StockTransferStatus.IN_TRANSIT,
          dispatchedAt: new Date(),
          dispatchedByUserId: tenant.userId,
        },
      });

      if (claimed.count !== 1) {
        throw new ConflictException(
          "Stock transfer state changed concurrently. Refresh and retry.",
        );
      }

      for (const line of existing.lines) {
        if (!line.item.trackInventory) {
          throw new BadRequestException(
            `Item "${line.item.sku}" does not track inventory.`,
          );
        }

        const bal = await tx.stockBalance.findUnique({
          where: {
            organizationId_itemId_locationId: {
              organizationId,
              itemId: line.itemId,
              locationId: existing.fromLocationId,
            },
          },
        });

        const currentQty = bal?.onHandQty ?? 0;
        const nextQty = currentQty - line.quantity;

        if (nextQty < 0 && !line.item.allowNegativeStock) {
          throw new BadRequestException(
            `Insufficient stock for SKU "${line.item.sku}" at "${existing.fromLocation.code}" (on hand: ${currentQty}, transfer qty: ${line.quantity}).`,
          );
        }

        const updatedBalance = bal
          ? await tx.stockBalance.update({
              where: { id: bal.id },
              data: { onHandQty: nextQty },
            })
          : await tx.stockBalance.create({
              data: {
                organizationId,
                itemId: line.itemId,
                locationId: existing.fromLocationId,
                onHandQty: nextQty,
                reservedQty: 0,
              },
            });

        await tx.stockMovement.create({
          data: {
            organizationId,
            itemId: line.itemId,
            locationId: existing.fromLocationId,
            type: StockMovementType.TRANSFER_OUT,
            quantityDelta: -line.quantity,
            balanceAfter: updatedBalance.onHandQty,
            referenceType: "StockTransfer",
            referenceId: existing.id,
            reason: `Dispatched transfer ${existing.transferNumber} to ${existing.toLocation.code}`,
            actorUserId: tenant.userId,
          },
        });
      }

      const dispatched = await tx.stockTransfer.findFirstOrThrow({
        where: { id: transferId, organizationId },
        include: {
          fromLocation: { select: { id: true, code: true, name: true, type: true } },
          toLocation: { select: { id: true, code: true, name: true, type: true } },
          lines: {
            include: {
              item: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "inventory.transfer.dispatched",
          resourceType: "StockTransfer",
          resourceId: existing.id,
          metadata: {
            transferNumber: existing.transferNumber,
            fromLocationCode: existing.fromLocation.code,
            toLocationCode: existing.toLocation.code,
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return dispatched;
    });
  }

  async receiveTransfer(
    tenant: AuthenticatedTenant,
    transferId: string,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    return this.prismaService.raw.$transaction(async (tx) => {
      const existing = await tx.stockTransfer.findFirst({
        where: { id: transferId, organizationId },
        include: {
          fromLocation: true,
          toLocation: true,
          lines: { include: { item: true } },
        },
      });

      if (!existing) {
        throw new NotFoundException("Stock transfer was not found.");
      }

      if (existing.status !== StockTransferStatus.IN_TRANSIT) {
        throw new BadRequestException(
          `Only IN_TRANSIT transfers can be received (current status: ${existing.status}).`,
        );
      }

      if (existing.toLocation.status !== LocationStatus.ACTIVE) {
        throw new BadRequestException(
          "Destination location must be ACTIVE to receive stock.",
        );
      }

      const claimed = await tx.stockTransfer.updateMany({
        where: {
          id: transferId,
          organizationId,
          status: StockTransferStatus.IN_TRANSIT,
        },
        data: {
          status: StockTransferStatus.RECEIVED,
          receivedAt: new Date(),
          receivedByUserId: tenant.userId,
        },
      });

      if (claimed.count !== 1) {
        throw new ConflictException(
          "Stock transfer state changed concurrently. Refresh and retry.",
        );
      }

      for (const line of existing.lines) {
        const bal = await tx.stockBalance.upsert({
          where: {
            organizationId_itemId_locationId: {
              organizationId,
              itemId: line.itemId,
              locationId: existing.toLocationId,
            },
          },
          create: {
            organizationId,
            itemId: line.itemId,
            locationId: existing.toLocationId,
            onHandQty: line.quantity,
            reservedQty: 0,
          },
          update: {
            onHandQty: { increment: line.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            organizationId,
            itemId: line.itemId,
            locationId: existing.toLocationId,
            type: StockMovementType.TRANSFER_IN,
            quantityDelta: line.quantity,
            balanceAfter: bal.onHandQty,
            referenceType: "StockTransfer",
            referenceId: existing.id,
            reason: `Received transfer ${existing.transferNumber} from ${existing.fromLocation.code}`,
            actorUserId: tenant.userId,
          },
        });
      }

      const received = await tx.stockTransfer.findFirstOrThrow({
        where: { id: transferId, organizationId },
        include: {
          fromLocation: { select: { id: true, code: true, name: true, type: true } },
          toLocation: { select: { id: true, code: true, name: true, type: true } },
          lines: {
            include: {
              item: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "inventory.transfer.received",
          resourceType: "StockTransfer",
          resourceId: existing.id,
          metadata: {
            transferNumber: existing.transferNumber,
            toLocationCode: existing.toLocation.code,
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return received;
    });
  }

  async cancelTransfer(
    tenant: AuthenticatedTenant,
    transferId: string,
    reason?: string,
    ipAddress?: string,
  ) {
    const organizationId = this.resolveVerifiedOrganizationId(tenant);

    return this.prismaService.raw.$transaction(async (tx) => {
      const existing = await tx.stockTransfer.findFirst({
        where: { id: transferId, organizationId },
        include: {
          fromLocation: true,
          toLocation: true,
          lines: { include: { item: true } },
        },
      });

      if (!existing) {
        throw new NotFoundException("Stock transfer was not found.");
      }

      if (
        existing.status !== StockTransferStatus.DRAFT &&
        existing.status !== StockTransferStatus.IN_TRANSIT
      ) {
        throw new BadRequestException(
          `Transfers in status "${existing.status}" cannot be cancelled.`,
        );
      }

      const claimed = await tx.stockTransfer.updateMany({
        where: {
          id: transferId,
          organizationId,
          status: existing.status,
        },
        data: {
          status: StockTransferStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw new ConflictException(
          "Stock transfer state changed concurrently. Refresh and retry.",
        );
      }

      if (existing.status === StockTransferStatus.IN_TRANSIT) {
        for (const line of existing.lines) {
          const bal = await tx.stockBalance.upsert({
            where: {
              organizationId_itemId_locationId: {
                organizationId,
                itemId: line.itemId,
                locationId: existing.fromLocationId,
              },
            },
            create: {
              organizationId,
              itemId: line.itemId,
              locationId: existing.fromLocationId,
              onHandQty: line.quantity,
              reservedQty: 0,
            },
            update: {
              onHandQty: { increment: line.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              organizationId,
              itemId: line.itemId,
              locationId: existing.fromLocationId,
              type: StockMovementType.ADJUSTMENT,
              quantityDelta: line.quantity,
              balanceAfter: bal.onHandQty,
              referenceType: "StockTransfer",
              referenceId: existing.id,
              reason: reason
                ? `Cancelled in-transit transfer ${existing.transferNumber}: ${reason}`
                : `Cancelled in-transit transfer ${existing.transferNumber}`,
              actorUserId: tenant.userId,
            },
          });
        }
      }

      const cancelled = await tx.stockTransfer.findFirstOrThrow({
        where: { id: transferId, organizationId },
        include: {
          fromLocation: { select: { id: true, code: true, name: true, type: true } },
          toLocation: { select: { id: true, code: true, name: true, type: true } },
          lines: {
            include: {
              item: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: tenant.userId,
          action: "inventory.transfer.cancelled",
          resourceType: "StockTransfer",
          resourceId: existing.id,
          metadata: {
            transferNumber: existing.transferNumber,
            previousStatus: existing.status,
            ...(reason ? { reason } : {}),
          } as Prisma.InputJsonValue,
          ipAddress: ipAddress ?? null,
        },
      });

      return cancelled;
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
