import { Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import type { FastifyRequest } from "fastify";
import { TenantsService } from "./tenants.service.js";

@Controller("api/v1/tenants/invitations")
export class InvitationsController {
  constructor(
    @Inject(TenantsService) private readonly tenantsService: TenantsService,
  ) {}

  @Post(":invitationId/accept")
  async acceptInvitation(
    @Param("invitationId") invitationId: string,
    @Session() userSession: UserSession,
    @Req() req: FastifyRequest,
  ) {
    return this.tenantsService.acceptInvitation(
      invitationId,
      userSession.user.emailVerified,
      req.headers,
    );
  }
}
