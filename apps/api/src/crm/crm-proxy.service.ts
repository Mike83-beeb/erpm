import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ItemStatus, type Prisma } from "@scace/db";
import { PrismaService } from "../database/prisma.service.js";
import type { AuthenticatedTenant } from "../tenancy/tenant.decorators.js";
import { CrmBridgeService, type LinkDealItemInput } from "./crm-bridge.service.js";
import { CrmConnectionService } from "./crm-connection.service.js";
import {
  CustomerMatesClient,
  type CrmRecord,
  type CustomerMatesResource,
} from "./customermates.client.js";

export interface CrmListQuery {
  search?: string;
  limit?: number;
  cursor?: string;
  stage?: string;
  status?: string;
  ownerStaffId?: string;
}

@Injectable()
export class CrmProxyService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(CrmConnectionService)
    private readonly connectionService: CrmConnectionService,
    @Inject(CrmBridgeService) private readonly bridgeService: CrmBridgeService,
    @Inject(CustomerMatesClient)
    private readonly customerMatesClient: CustomerMatesClient,
  ) {}

  private extractExternalOwnerId(record: Record<string, unknown>): string | null {
    const candidates = [
      record.ownerId,
      record.assigneeId,
      record.userId,
      record.assignedToId,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim().length > 0) {
        return c.trim();
      }
    }
    return null;
  }

  private async enrichRecords(
    organizationId: string,
    resource: CustomerMatesResource,
    records: CrmRecord[],
  ): Promise<Array<CrmRecord & Record<string, unknown>>> {
    if (records.length === 0) {
      return [];
    }

    const staffIndex =
      resource === "deals" || resource === "tasks" || resource === "contacts"
        ? await this.bridgeService.getStaffMappingIndex(organizationId)
        : new Map();

    let linksByDeal = new Map<
      string,
      Array<{
        id: string;
        itemId: string;
        externalServiceId: string | null;
        quantity: number;
        unitPriceCents: number;
        currency: string;
        lineTotalCents: number;
        item: {
          id: string;
          sku: string;
          name: string;
          type: string;
          unitOfMeasure: string;
        };
      }>
    >();

    if (resource === "deals") {
      const dealIds = records.map((r) => r.id);
      const links = await this.prismaService.raw.crmDealItemLink.findMany({
        where: {
          organizationId,
          externalDealId: { in: dealIds },
        },
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
      });

      for (const link of links) {
        const list = linksByDeal.get(link.externalDealId) ?? [];
        list.push({
          id: link.id,
          itemId: link.itemId,
          externalServiceId: link.externalServiceId,
          quantity: link.quantity,
          unitPriceCents: link.unitPriceCents,
          currency: link.currency,
          lineTotalCents: link.quantity * link.unitPriceCents,
          item: link.item,
        });
        linksByDeal.set(link.externalDealId, list);
      }
    }

    return records.map((record) => {
      const extOwner = this.extractExternalOwnerId(record);
      const ownerStaff = extOwner ? staffIndex.get(extOwner) ?? null : null;

      if (resource === "deals") {
        const linkedItems = linksByDeal.get(record.id) ?? [];
        const linkedSubtotalCents = linkedItems.reduce(
          (sum, row) => sum + row.lineTotalCents,
          0,
        );
        return {
          ...record,
          ownerStaff,
          linkedItems,
          linkedSubtotalCents,
        };
      }

      if (resource === "tasks" || resource === "contacts") {
        return {
          ...record,
          ownerStaff,
        };
      }

      return record;
    });
  }

  private async preparePayloadWithStaffOwner(
    organizationId: string,
    payload: Record<string, unknown>,
    ownerKey: "ownerId" | "assigneeId" = "ownerId",
  ): Promise<Record<string, unknown>> {
    const { ownerStaffId, items: _items, ...rest } = payload;
    const cleanPayload: Record<string, unknown> = { ...rest };

    if (typeof ownerStaffId === "string" && ownerStaffId.trim().length > 0) {
      const resolved = await this.bridgeService.resolveExternalOwnerFromStaff(
        organizationId,
        ownerStaffId.trim(),
      );
      cleanPayload[ownerKey] = resolved.externalUserId;
    }

    return cleanPayload;
  }

  async listResources(
    tenant: AuthenticatedTenant,
    resource: CustomerMatesResource,
    query: CrmListQuery,
  ) {
    const ctx = await this.connectionService.resolveActiveConnection(
      tenant.organizationId,
    );

    let ownerFilter: string | undefined;
    if (query.ownerStaffId) {
      const resolved = await this.bridgeService.resolveExternalOwnerFromStaff(
        tenant.organizationId,
        query.ownerStaffId,
      );
      ownerFilter = resolved.externalUserId;
    }

    const upstream = await this.customerMatesClient.listResources(
      ctx,
      resource,
      {
        search: query.search,
        limit: query.limit,
        cursor: query.cursor,
        stage: query.stage,
        status: query.status,
        ...(ownerFilter ? { ownerId: ownerFilter } : {}),
      },
    );

    const rawItems = Array.isArray(upstream.items)
      ? (upstream.items as CrmRecord[])
      : [];

    const enriched = await this.enrichRecords(
      tenant.organizationId,
      resource,
      rawItems,
    );

    return {
      organizationId: tenant.organizationId,
      ...upstream,
      items: enriched,
    };
  }

  async getResource(
    tenant: AuthenticatedTenant,
    resource: CustomerMatesResource,
    id: string,
  ) {
    const ctx = await this.connectionService.resolveActiveConnection(
      tenant.organizationId,
    );
    const record = await this.customerMatesClient.getResource(ctx, resource, id);
    const [enriched] = await this.enrichRecords(
      tenant.organizationId,
      resource,
      [record],
    );
    return enriched ?? record;
  }

  async createResource(
    tenant: AuthenticatedTenant,
    resource: CustomerMatesResource,
    payload: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const ctx = await this.connectionService.resolveActiveConnection(
      tenant.organizationId,
    );

    const itemsToLink =
      resource === "deals" && Array.isArray(payload.items)
        ? (payload.items as LinkDealItemInput[])
        : [];

    if (itemsToLink.length > 0) {
      const itemIds = itemsToLink.map((i) => i.itemId);
      const foundItems = await this.prismaService.scoped.item.findMany({
        where: {
          organizationId: tenant.organizationId,
          id: { in: itemIds },
          status: { not: ItemStatus.ARCHIVED },
        },
        select: { id: true },
      });
      if (foundItems.length !== new Set(itemIds).size) {
        throw new BadRequestException(
          "One or more catalog items were not found or are archived in the active organization.",
        );
      }
    }

    const ownerKey = resource === "tasks" ? "assigneeId" : "ownerId";
    const upstreamPayload = await this.preparePayloadWithStaffOwner(
      tenant.organizationId,
      payload,
      ownerKey,
    );

    const created = await this.customerMatesClient.createResource(
      ctx,
      resource,
      upstreamPayload,
    );

    if (resource === "deals" && itemsToLink.length > 0) {
      for (const linkInput of itemsToLink) {
        await this.bridgeService.linkItemToDeal(
          tenant,
          created.id,
          linkInput,
          ipAddress,
        );
      }
    }

    await this.prismaService.scoped.auditLog.create({
      data: {
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        action: `crm.${resource}.created`,
        resourceType: "CustomerMates",
        resourceId: created.id,
        metadata: {
          resource,
          externalId: created.id,
        } as Prisma.InputJsonValue,
        ipAddress: ipAddress ?? null,
      },
    });

    const [enriched] = await this.enrichRecords(
      tenant.organizationId,
      resource,
      [created],
    );
    return enriched ?? created;
  }

  async updateResource(
    tenant: AuthenticatedTenant,
    resource: CustomerMatesResource,
    id: string,
    payload: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const ctx = await this.connectionService.resolveActiveConnection(
      tenant.organizationId,
    );

    const ownerKey = resource === "tasks" ? "assigneeId" : "ownerId";
    const upstreamPayload = await this.preparePayloadWithStaffOwner(
      tenant.organizationId,
      payload,
      ownerKey,
    );

    const updated = await this.customerMatesClient.updateResource(
      ctx,
      resource,
      id,
      upstreamPayload,
    );

    await this.prismaService.scoped.auditLog.create({
      data: {
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        action: `crm.${resource}.updated`,
        resourceType: "CustomerMates",
        resourceId: id,
        metadata: { resource, externalId: id } as Prisma.InputJsonValue,
        ipAddress: ipAddress ?? null,
      },
    });

    const [enriched] = await this.enrichRecords(
      tenant.organizationId,
      resource,
      [updated],
    );
    return enriched ?? updated;
  }

  async deleteResource(
    tenant: AuthenticatedTenant,
    resource: CustomerMatesResource,
    id: string,
    ipAddress?: string,
  ) {
    const ctx = await this.connectionService.resolveActiveConnection(
      tenant.organizationId,
    );

    const result = await this.customerMatesClient.deleteResource(
      ctx,
      resource,
      id,
    );

    if (resource === "deals") {
      await this.prismaService.scoped.crmDealItemLink.deleteMany({
        where: {
          organizationId: tenant.organizationId,
          externalDealId: id,
        },
      });
    }

    await this.prismaService.scoped.auditLog.create({
      data: {
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        action: `crm.${resource}.deleted`,
        resourceType: "CustomerMates",
        resourceId: id,
        metadata: { resource, externalId: id } as Prisma.InputJsonValue,
        ipAddress: ipAddress ?? null,
      },
    });

    return result;
  }

  async getDealWithContext(tenant: AuthenticatedTenant, dealId: string) {
    const ctx = await this.connectionService.resolveActiveConnection(
      tenant.organizationId,
    );
    const deal = await this.customerMatesClient.getResource(ctx, "deals", dealId);
    if (!deal) {
      throw new NotFoundException("CustomerMates deal not found.");
    }
    const [enriched] = await this.enrichRecords(
      tenant.organizationId,
      "deals",
      [deal],
    );
    return enriched ?? deal;
  }
}
