import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

@Controller()
export class RootController {
  @Get()
  @AllowAnonymous()
  getServiceInfo() {
    return {
      service: "Scace API",
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
        storage: "/api/v1/storage",
        departments: "/api/v1/departments",
        staff: "/api/v1/staff",
        teams: "/api/v1/teams",
        schedules: "/api/v1/schedules",
        holidays: "/api/v1/holidays",
        timeOff: "/api/v1/time-off",
        availability: "/api/v1/availability",
        calendar: "/api/v1/calendar",
        crm: "/api/v1/crm",
      },
    };
  }
}
