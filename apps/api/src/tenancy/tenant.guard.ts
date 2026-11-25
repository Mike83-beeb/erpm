import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  hasOrganizationPermission,
  type OrgPermissionRequirement,
} from "../auth/permissions.js";
import { PrismaService } from "../database/prisma.service.js";
import { RedisService } from "../redis/redis.service.js";
import {
  TENANT_PERMISSIONS_KEY,
  TENANT_ROLES_KEY,
  type AuthenticatedTenant,
  type TenantScopedRequest,
} from "./tenant.decorators.js";

interface CachedMembership {
  memberId: string;
  role: string;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantScopedRequest>();
    const userSession = request.session;
    const authContext = request.authContext;

    if (!userSession?.user?.id) {
      throw new UnauthorizedException("Authentication required.");
    }

    if (!authContext?.isServicePrincipal && userSession.user.emailVerified === false) {
      throw new ForbiddenException(
        "Email verification is required before accessing organization resources.",
      );
    }

    const organizationId =
      authContext?.organizationId ?? userSession.session?.activeOrganizationId;
    if (!organizationId) {
      throw new ForbiddenException(
        "No active organization selected. Call /api/auth/organization/set-active before accessing tenant resources.",
      );
    }

    const userId = userSession.user.id;
    let membership: CachedMembership | null = null;

    if (authContext?.isServicePrincipal) {
      membership = {
        memberId: `service:${authContext.oauthClientId ?? authContext.clientId ?? "client"}`,
        role: authContext.serviceRole ?? "member",
      };
    } else {
      const cacheKey = `membership:${organizationId}:${userId}`;
      try {
        membership = await this.redisService.getJson<CachedMembership>(cacheKey);
      } catch {
        membership = null;
      }

      if (!membership) {
        const dbMember = await this.prismaService.raw.member.findUnique({
          where: {
            organizationId_userId: {
              organizationId,
              userId,
            },
          },
          select: {
            id: true,
            role: true,
          },
        });

        if (!dbMember) {
          throw new ForbiddenException(
            "You are not a member of the active organization.",
          );
        }

        membership = {
          memberId: dbMember.id,
          role: dbMember.role,
        };

        try {
          await this.redisService.setJson(cacheKey, membership, 60);
        } catch {
          // Non-fatal if Redis cache write is temporarily unavailable
        }
      }
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      TENANT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = membership.role
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException(
          `Insufficient organization permissions. Required role: ${requiredRoles.join(" or ")}.`,
        );
      }
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<OrgPermissionRequirement>(
        TENANT_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (
      requiredPermissions &&
      !hasOrganizationPermission(
        membership.role,
        requiredPermissions,
        authContext?.grantedScopes,
      )
    ) {
      throw new ForbiddenException(
        "Insufficient organization permissions or token scope for the requested action.",
      );
    }

    const tenant: AuthenticatedTenant = {
      organizationId,
      memberId: membership.memberId,
      role: membership.role,
      userId,
      authMethod: authContext?.authMethod ?? "COOKIE_SESSION",
      grantedScopes: authContext?.grantedScopes,
      patId: authContext?.patId,
      oauthClientId: authContext?.oauthClientId,
      clientId: authContext?.clientId,
      deviceId: authContext?.deviceId,
      isServicePrincipal: authContext?.isServicePrincipal ?? false,
    };
    request.tenant = tenant;

    return true;
  }
}
