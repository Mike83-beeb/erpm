import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import {
  CurrentTenant,
  RequireActiveTenant,
  RequiredOrgPermissions,
  type AuthenticatedTenant,
} from "../tenancy/tenant.decorators.js";
import { PatService } from "./pat.service.js";
import { ALL_ERP_SCOPES } from "./permissions.js";

const createPatSchema = z.object({
  name: z.string().trim().min(1).max(120),
  scopes: z.array(z.string().trim().min(1)).min(1).max(100),
  expiresAt: z.string().datetime().optional(),
  expiresInDays: z.number().int().min(1).max(730).optional(),
  ipAllowlist: z.array(z.string().trim().min(1).max(64)).max(50).optional(),
});

const listPatQuerySchema = z.object({
  includeAll: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

@Controller("api/v1/auth/pats")
@RequireActiveTenant()
export class PatController {
  constructor(@Inject(PatService) private readonly patService: PatService) {}

  @Get("scopes")
  @RequiredOrgPermissions({ apiToken: ["read"] })
  listAvailableScopes() {
    return { scopes: ALL_ERP_SCOPES };
  }

  @Post()
  @RequiredOrgPermissions({ apiToken: ["create"] })
  async createPat(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: unknown,
  ) {
    const parsed = createPatSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid Personal Access Token payload.",
        issues: parsed.error.issues,
      });
    }
    return this.patService.createPat(tenant, parsed.data);
  }

  @Get()
  @RequiredOrgPermissions({ apiToken: ["read"] })
  async listPats(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Query() query: unknown,
  ) {
    const parsed = listPatQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid PAT query parameters.",
        issues: parsed.error.issues,
      });
    }
    return this.patService.listPats(tenant, parsed.data.includeAll ?? false);
  }

  @Post(":patId/revoke")
  @RequiredOrgPermissions({ apiToken: ["revoke"] })
  async revokePatPost(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("patId") patId: string,
  ) {
    return this.patService.revokePat(tenant, patId);
  }

  @Delete(":patId")
  @RequiredOrgPermissions({ apiToken: ["revoke"] })
  async revokePatDelete(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("patId") patId: string,
  ) {
    return this.patService.revokePat(tenant, patId);
  }
}
