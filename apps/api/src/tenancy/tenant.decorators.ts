import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { TenantGuard } from "./tenant.guard.js";
import { TenantInterceptor } from "./tenant.interceptor.js";

export const TENANT_ROLES_KEY = "erp:tenant_roles";

export interface AuthenticatedTenant {
  organizationId: string;
  memberId: string;
  role: string;
  userId: string;
}

export type TenantScopedRequest = FastifyRequest & {
  session?: {
    user: { id: string; email: string; name: string };
    session: { id: string; activeOrganizationId?: string | null };
  };
  tenant?: AuthenticatedTenant;
};

export const RequiredOrgRoles = (...roles: string[]) =>
  SetMetadata(TENANT_ROLES_KEY, roles);

export const RequireActiveTenant = () =>
  applyDecorators(UseGuards(TenantGuard), UseInterceptors(TenantInterceptor));

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedTenant => {
    const request = ctx.switchToHttp().getRequest<TenantScopedRequest>();
    if (!request.tenant) {
      throw new Error(
        "CurrentTenant decorator requires @RequireActiveTenant() on the route or controller.",
      );
    }
    return request.tenant;
  },
);
