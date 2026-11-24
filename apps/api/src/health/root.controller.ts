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
        tenantPermissions: "/api/v1/tenants/permissions",
        tenantSettings: "/api/v1/tenants/settings",
        tenantMembers: "/api/v1/tenants/members",
        tenantInvitations: "/api/v1/tenants/invitations",
        tenantAuditLogs: "/api/v1/tenants/audit-logs",
        items: "/api/v1/items",
        locations: "/api/v1/locations",
        inventory: "/api/v1/inventory",
        suppliers: "/api/v1/suppliers",
        purchaseOrders: "/api/v1/purchase-orders",
        vendorBills: "/api/v1/vendor-bills",
      },
    };
  }
}
