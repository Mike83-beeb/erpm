import { AsyncLocalStorage } from "node:async_hooks";

const tenantStorage = new AsyncLocalStorage<string>();

export const TenantContext = {
  run<T>(organizationId: string, fn: () => T): T {
    if (!organizationId || typeof organizationId !== "string") {
      throw new Error("A valid organizationId is required to enter TenantContext.");
    }
    return tenantStorage.run(organizationId, fn);
  },

  getOrganizationId(): string | undefined {
    return tenantStorage.getStore();
  },

  requireOrganizationId(): string {
    const organizationId = tenantStorage.getStore();
    if (!organizationId) {
      throw new Error(
        "TenantContext missing: protected tenant query executed outside an active organization scope.",
      );
    }
    return organizationId;
  },
};
