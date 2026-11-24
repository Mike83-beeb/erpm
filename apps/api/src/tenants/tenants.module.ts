import { Module } from "@nestjs/common";
import { InvitationsController } from "./invitations.controller.js";
import { TenantsController } from "./tenants.controller.js";
import { TenantsService } from "./tenants.service.js";

@Module({
  controllers: [InvitationsController, TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
