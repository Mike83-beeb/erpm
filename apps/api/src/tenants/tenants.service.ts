import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { RedisService } from "../redis/redis.service.js";
import type { AuthenticatedTenant } from "../tenancy/tenant.decorators.js";
import type { Prisma } from "@erp/db";

export interface UpdateTenantSettingsInput {
  companyLegalName?: string | null;
  defaultCurrency?: string;
  timezone?: string;
  fiscalYearStartMonth?: number;
  features?: Record<string, boolean>;
}

@Injectable()
export class TenantsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
  ) {}

  async getCurrentTenantOverview(tenant: AuthenticatedTenant) {
    const organization = await this.prismaService.raw.organization.findUnique({
      where: { id: tenant.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        metadata: true,
      },
    });

    if (!organization) {
      throw new NotFoundException("Active organization was not found.");
    }

    const settings = await this.getOrCreateSettings(tenant.organizationId);

    return {
      organization,
      membership: {
        memberId: tenant.memberId,
        role: tenant.role,
        userId: tenant.userId,
      },
      settings,
    };
  }

  async getOrCreateSettings(organizationId: string) {
    const cacheKey = `tenant:${organizationId}:settings`;

    try {
      const cached = await this.redisService.getJson<Record<string, unknown>>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // Fallback to PostgreSQL on Redis read error
    }

    // Tenant-scoped Prisma client automatically filters by TenantContext organizationId
    let settings = await this.prismaService.scoped.tenantSettings.findFirst({});

    if (!settings) {
      settings = await this.prismaService.scoped.tenantSettings.create({
        data: {
          organizationId,
          defaultCurrency: "USD",
          timezone: "UTC",
          fiscalYearStartMonth: 1,
        },
      });
    }

    try {
      await this.redisService.setJson(cacheKey, settings, 300);
    } catch {
      // Non-fatal cache population error
    }

    return settings;
  }

  async updateSettings(
    tenant: AuthenticatedTenant,
    input: UpdateTenantSettingsInput,
    ipAddress?: string,
  ) {
    const existing = await this.prismaService.scoped.tenantSettings.findFirst({});

    const updated = existing
      ? await this.prismaService.scoped.tenantSettings.update({
          where: { id: existing.id },
          data: {
            ...(input.companyLegalName !== undefined
              ? { companyLegalName: input.companyLegalName }
              : {}),
            ...(input.defaultCurrency !== undefined
              ? { defaultCurrency: input.defaultCurrency }
              : {}),
            ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
            ...(input.fiscalYearStartMonth !== undefined
              ? { fiscalYearStartMonth: input.fiscalYearStartMonth }
              : {}),
            ...(input.features !== undefined
              ? { features: input.features as Prisma.InputJsonValue }
              : {}),
          },
        })
      : await this.prismaService.scoped.tenantSettings.create({
          data: {
            organizationId: tenant.organizationId,
            companyLegalName: input.companyLegalName ?? null,
            defaultCurrency: input.defaultCurrency ?? "USD",
            timezone: input.timezone ?? "UTC",
            fiscalYearStartMonth: input.fiscalYearStartMonth ?? 1,
            ...(input.features !== undefined
              ? { features: input.features as Prisma.InputJsonValue }
              : {}),
          },
        });

    await this.prismaService.scoped.auditLog.create({
      data: {
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        action: "tenant.settings.updated",
        resourceType: "TenantSettings",
        resourceId: updated.id,
        metadata: input as Prisma.InputJsonValue,
        ipAddress: ipAddress ?? null,
      },
    });

    try {
      await this.redisService.invalidateTenantCache(
        tenant.organizationId,
        "settings",
      );
    } catch {
      // Non-fatal cache invalidation error
    }

    return updated;
  }

  async listAuditLogs(limit = 25, cursor?: string) {
    const take = Math.min(Math.max(limit, 1), 100);
    const logs = await this.prismaService.scoped.auditLog.findMany({
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });

    const hasMore = logs.length > take;
    const items = hasMore ? logs.slice(0, take) : logs;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    return {
      items,
      nextCursor,
    };
  }
}
