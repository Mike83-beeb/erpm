import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

@Controller()
export class RootController {
  @Get()
  @AllowAnonymous()
  getServiceInfo() {
    return {
      service: "NexusERP API",
      status: "ok",
      endpoints: {
        health: "/api/v1/health",
        auth: "/api/auth/ok",
        me: "/api/v1/me",
        tenantCurrent: "/api/v1/tenants/current",
        tenantSettings: "/api/v1/tenants/settings",
        tenantAuditLogs: "/api/v1/tenants/audit-logs",
      },
    };
  }
}
