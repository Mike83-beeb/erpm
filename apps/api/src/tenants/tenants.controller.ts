import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Query,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import {
  CurrentTenant,
  RequireActiveTenant,
  RequiredOrgRoles,
  type AuthenticatedTenant,
} from "../tenancy/tenant.decorators.js";
import { TenantsService } from "./tenants.service.js";

const updateTenantSettingsSchema = z.object({
  companyLegalName: z.string().trim().min(1).max(200).nullable().optional(),
  defaultCurrency: z
    .string()
    .trim()
    .length(3)
    .transform((val) => val.toUpperCase())
    .optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
  features: z.record(z.string(), z.boolean()).optional(),
});

const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
});

@Controller("api/v1/tenants")
@RequireActiveTenant()
export class TenantsController {
  constructor(
    @Inject(TenantsService) private readonly tenantsService: TenantsService,
  ) {}

  @Get("current")
  async getCurrentTenant(@CurrentTenant() tenant: AuthenticatedTenant) {
    return this.tenantsService.getCurrentTenantOverview(tenant);
  }

  @Patch("settings")
  @RequiredOrgRoles("owner", "admin")
  async updateSettings(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = updateTenantSettingsSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid tenant settings payload.",
        issues: parsed.error.issues,
      });
    }

    return this.tenantsService.updateSettings(tenant, parsed.data, req.ip);
  }

  @Get("audit-logs")
  @RequiredOrgRoles("owner", "admin")
  async getAuditLogs(@Query() query: unknown) {
    const parsed = auditQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid audit log query parameters.",
        issues: parsed.error.issues,
      });
    }

    return this.tenantsService.listAuditLogs(
      parsed.data.limit,
      parsed.data.cursor,
    );
  }
}
