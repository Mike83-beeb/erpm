import { prismaAdapter } from "@better-auth/prisma-adapter";
import { redisStorage } from "@better-auth/redis-storage";
import { prisma } from "@erp/db";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { Redis } from "ioredis";
import { getEnv } from "../config/env.js";

const env = getEnv();

export const authRedisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

authRedisClient.on("error", (err: Error) => {
  console.warn(`[better-auth:redis] ${err.message}`);
});

export const auth = betterAuth({
  appName: "NexusERP",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  trustedOrigins: env.CORS_ALLOWED_ORIGINS,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secondaryStorage: redisStorage({
    client: authRedisClient,
    keyPrefix: "better-auth:",
  }),
  session: {
    storeSessionInDatabase: true,
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const defaultMembership = await prisma.member.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
            select: { organizationId: true },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: defaultMembership?.organizationId ?? null,
            },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
});
