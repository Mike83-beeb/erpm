import { Injectable, OnModuleDestroy } from "@nestjs/common";
import {
  disconnectPrisma,
  forTenant,
  prisma,
  tenantPrisma,
} from "@scace/db";

@Injectable()
export class PrismaService implements OnModuleDestroy {
  /**
   * Unscoped Prisma client for system-level queries, health checks,
   * and Better Auth's database adapter.
   */
  public readonly raw = prisma;

  /**
   * Context-aware tenant-isolated Prisma client. Automatically scopes
   * queries and mutations on tenant models using TenantContext.
   */
  public readonly scoped = tenantPrisma;

  /**
   * Returns a Prisma client explicitly locked to a specific organizationId.
   */
  forTenant(organizationId: string) {
    return forTenant(organizationId);
  }

  async ping(): Promise<boolean> {
    await this.raw.$queryRaw`SELECT 1`;
    return true;
  }

  async onModuleDestroy(): Promise<void> {
    await disconnectPrisma();
  }
}
