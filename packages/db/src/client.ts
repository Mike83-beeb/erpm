import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { TenantContext } from "./tenant-context.js";

export const TENANT_SCOPED_MODELS = new Set<string>([
  "TenantSettings",
  "AuditLog",
  "Item",
  "ItemRevision",
]);

const DEFAULT_LOCAL_DB_URL =
  "postgresql://erp:erp_dev_password@localhost:5432/erp_db?schema=public";

let sharedPool: Pool | null = null;

export function createPrismaClient(connectionString?: string): PrismaClient {
  const url =
    connectionString ?? process.env.DATABASE_URL ?? DEFAULT_LOCAL_DB_URL;
  const pool = new Pool({ connectionString: url });
  if (!connectionString) {
    sharedPool = pool;
  }
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = createPrismaClient();

function toDelegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function withScopedWhere(
  where: Record<string, unknown> | undefined,
  organizationId: string,
): Record<string, unknown> {
  if (!where || Object.keys(where).length === 0) {
    return { organizationId };
  }
  return {
    AND: [where, { organizationId }],
  };
}

function stripOrganizationOverride(
  data: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!data) {
    return {};
  }
  const { organization: _org, organizationId: _orgId, ...rest } = data;
  return rest;
}

export function withTenantIsolation(
  baseClient: PrismaClient,
  explicitOrganizationId?: string,
) {
  return baseClient.$extends({
    name: "tenant-isolation",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const organizationId =
            explicitOrganizationId ?? TenantContext.requireOrganizationId();

          const opArgs = (args ?? {}) as Record<string, unknown>;
          const delegate = (baseClient as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>)[
            toDelegateName(model)
          ];

          const executeQuery = query as (nextArgs: unknown) => Promise<unknown>;

          switch (operation) {
            case "findMany":
            case "findFirst":
            case "findFirstOrThrow":
            case "count":
            case "aggregate":
            case "groupBy": {
              return executeQuery({
                ...opArgs,
                where: withScopedWhere(
                  opArgs.where as Record<string, unknown> | undefined,
                  organizationId,
                ),
              });
            }

            case "findUnique": {
              if (!delegate?.findFirst) {
                throw new Error(`Missing Prisma delegate for model ${model}`);
              }
              return delegate.findFirst({
                ...opArgs,
                where: withScopedWhere(
                  opArgs.where as Record<string, unknown> | undefined,
                  organizationId,
                ),
              });
            }

            case "findUniqueOrThrow": {
              if (!delegate?.findFirstOrThrow) {
                throw new Error(`Missing Prisma delegate for model ${model}`);
              }
              return delegate.findFirstOrThrow({
                ...opArgs,
                where: withScopedWhere(
                  opArgs.where as Record<string, unknown> | undefined,
                  organizationId,
                ),
              });
            }

            case "create": {
              const cleanData = stripOrganizationOverride(
                opArgs.data as Record<string, unknown> | undefined,
              );
              return executeQuery({
                ...opArgs,
                data: {
                  ...cleanData,
                  organizationId,
                },
              });
            }

            case "createMany":
            case "createManyAndReturn": {
              const rawData = opArgs.data;
              const scopedData = Array.isArray(rawData)
                ? rawData.map((item) => ({
                    ...stripOrganizationOverride(item as Record<string, unknown>),
                    organizationId,
                  }))
                : {
                    ...stripOrganizationOverride(
                      rawData as Record<string, unknown> | undefined,
                    ),
                    organizationId,
                  };
              return executeQuery({
                ...opArgs,
                data: scopedData,
              });
            }

            case "update": {
              return executeQuery({
                ...opArgs,
                where: {
                  ...(opArgs.where as Record<string, unknown> | undefined),
                  organizationId,
                },
                data: stripOrganizationOverride(
                  opArgs.data as Record<string, unknown> | undefined,
                ),
              });
            }

            case "updateMany":
            case "updateManyAndReturn": {
              return executeQuery({
                ...opArgs,
                where: withScopedWhere(
                  opArgs.where as Record<string, unknown> | undefined,
                  organizationId,
                ),
                data: stripOrganizationOverride(
                  opArgs.data as Record<string, unknown> | undefined,
                ),
              });
            }

            case "delete": {
              return executeQuery({
                ...opArgs,
                where: {
                  ...(opArgs.where as Record<string, unknown> | undefined),
                  organizationId,
                },
              });
            }

            case "deleteMany": {
              return executeQuery({
                ...opArgs,
                where: withScopedWhere(
                  opArgs.where as Record<string, unknown> | undefined,
                  organizationId,
                ),
              });
            }

            case "upsert": {
              const createData = stripOrganizationOverride(
                opArgs.create as Record<string, unknown> | undefined,
              );
              const updateData = stripOrganizationOverride(
                opArgs.update as Record<string, unknown> | undefined,
              );
              return executeQuery({
                ...opArgs,
                where: {
                  ...(opArgs.where as Record<string, unknown> | undefined),
                  organizationId,
                },
                create: {
                  ...createData,
                  organizationId,
                },
                update: updateData,
              });
            }

            default:
              return executeQuery(args);
          }
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof withTenantIsolation>;

export const tenantPrisma: TenantPrismaClient = withTenantIsolation(prisma);

export function forTenant(organizationId: string): TenantPrismaClient {
  return withTenantIsolation(prisma, organizationId);
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  if (sharedPool) {
    await sharedPool.end();
    sharedPool = null;
  }
}
