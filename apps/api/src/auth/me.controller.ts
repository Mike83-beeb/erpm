import { Controller, Get, Inject } from "@nestjs/common";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { PrismaService } from "../database/prisma.service.js";

@Controller("api/v1/me")
export class MeController {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  @Get()
  async getProfile(@Session() userSession: UserSession) {
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
        (userSession.session as { activeOrganizationId?: string | null })
          .activeOrganizationId ?? null,
      organizations: memberships.map((m) => ({
        memberId: m.id,
        role: m.role,
        ...m.organization,
      })),
    };
  }
}
