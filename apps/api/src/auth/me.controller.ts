import { Controller, Get, Inject, Req, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import type { TenantScopedRequest } from "../tenancy/tenant.decorators.js";

@Controller("api/v1/me")
export class MeController {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  @Get()
  async getProfile(@Req() req: TenantScopedRequest) {
    const userSession = req.session;
    if (!userSession?.user?.id) {
      throw new UnauthorizedException("Authentication required.");
    }

    const authContext = req.authContext;
    if (authContext?.isServicePrincipal && authContext.organizationId) {
      const org = await this.prismaService.raw.organization.findUnique({
        where: { id: authContext.organizationId },
        select: { id: true, name: true, slug: true, logo: true },
      });
      return {
        user: userSession.user,
        activeOrganizationId: authContext.organizationId,
        authContext,
        organizations: org
          ? [
              {
                memberId: `service:${authContext.oauthClientId ?? authContext.clientId}`,
                role: authContext.serviceRole ?? "member",
                ...org,
              },
            ]
          : [],
      };
    }

    const memberships = await this.prismaService.raw.member.findMany({
      where: { userId: userSession.user.id },
      select: {
        id: true,
        role: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      user: userSession.user,
      activeOrganizationId:
        authContext?.organizationId ??
        userSession.session?.activeOrganizationId ??
        null,
      authContext: authContext ?? null,
      organizations: memberships.map((m) => ({
        memberId: m.id,
        role: m.role,
        ...m.organization,
      })),
    };
  }
}
