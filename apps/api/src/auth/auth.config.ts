import { prisma, type Prisma } from "@scace/db";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { redisStorage } from "@better-auth/redis-storage";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { Redis } from "ioredis";
import { getEnv } from "../config/env.js";
import { emailDelivery } from "../email/email.service.js";
import { createRedisClientWithFallback, MockRedis } from "../redis/redis-mock.js";
import { ac, organizationRoles } from "./permissions.js";

const env = getEnv();

function createAuthRedisClient(): Redis {
  if (!process.env.REDIS_URL || process.env.REDIS_URL.trim().length === 0) {
    console.warn("[AI Studio] REDIS_URL not configured — using in-memory Redis mock for auth");
    return new MockRedis() as unknown as Redis;
  }

  return createRedisClientWithFallback(
    () =>
      new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 500,
        retryStrategy: () => null,
        enableReadyCheck: false,
        lazyConnect: true,
      }),
    { label: "AuthRedis" },
  );
}

export const authRedisClient: Redis = createAuthRedisClient();

async function invalidateMembershipCache(
  organizationId: string,
  userId: string,
): Promise<void> {
  try {
    if (authRedisClient.status === "wait") {
      await authRedisClient.connect();
    }
    await authRedisClient.del(
      `${env.REDIS_KEY_PREFIX}membership:${organizationId}:${userId}`,
    );
  } catch {
    // Non-fatal if Redis is unavailable during hook execution
  }
}

async function recordOrganizationAudit(params: {
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId ?? null,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.warn(
      `[better-auth:audit] Failed to record ${params.action}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export const auth = betterAuth({
  appName: "Scace",
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
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    async sendVerificationEmail({ user, url }) {
      await emailDelivery.sendVerificationEmail({
        to: user.email,
        userName: user.name,
        verificationUrl: url,
      });
    },
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
      ac,
      roles: organizationRoles,
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 48,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,
      async sendInvitationEmail(data) {
        const acceptUrl = `${env.BETTER_AUTH_URL}/api/v1/tenants/invitations/${encodeURIComponent(
          data.id,
        )}/accept`;

        await emailDelivery.sendOrganizationInvitationEmail({
          to: data.email,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          role: data.role,
          invitationId: data.id,
          acceptUrl,
          expiresAt: data.invitation.expiresAt,
        });
      },
      organizationHooks: {
        async afterCreateOrganization({ organization: org, user }) {
          await prisma.tenantSettings.upsert({
            where: { organizationId: org.id },
            update: {},
            create: {
              organizationId: org.id,
              defaultCurrency: "USD",
              timezone: "UTC",
              fiscalYearStartMonth: 1,
            },
          });

          await recordOrganizationAudit({
            organizationId: org.id,
            actorUserId: user.id,
            action: "organization.created",
            resourceType: "Organization",
            resourceId: org.id,
            metadata: { name: org.name, slug: org.slug },
          });
        },

        async afterAddMember({ member, user, organization: org }) {
          await invalidateMembershipCache(org.id, user.id);
          await recordOrganizationAudit({
            organizationId: org.id,
            actorUserId: user.id,
            action: "member.added",
            resourceType: "Member",
            resourceId: member.id,
            metadata: { userId: user.id, email: user.email, role: member.role },
          });
        },

        async afterUpdateMemberRole({
          member,
          previousRole,
          user,
          organization: org,
        }) {
          await invalidateMembershipCache(org.id, user.id);
          await recordOrganizationAudit({
            organizationId: org.id,
            actorUserId: user.id,
            action: "member.role.updated",
            resourceType: "Member",
            resourceId: member.id,
            metadata: {
              userId: user.id,
              previousRole,
              newRole: member.role,
            },
          });
        },

        async afterRemoveMember({ member, user, organization: org }) {
          await invalidateMembershipCache(org.id, user.id);
          await recordOrganizationAudit({
            organizationId: org.id,
            actorUserId: user.id,
            action: "member.removed",
            resourceType: "Member",
            resourceId: member.id,
            metadata: { userId: user.id, email: user.email, role: member.role },
          });
        },

        async afterCreateInvitation({ invitation, inviter, organization: org }) {
          await recordOrganizationAudit({
            organizationId: org.id,
            actorUserId: inviter.id,
            action: "invitation.created",
            resourceType: "Invitation",
            resourceId: invitation.id,
            metadata: {
              email: invitation.email,
              role: invitation.role,
              expiresAt: invitation.expiresAt.toISOString(),
            },
          });
        },

        async afterAcceptInvitation({
          invitation,
          member,
          user,
          organization: org,
        }) {
          await invalidateMembershipCache(org.id, user.id);
          await recordOrganizationAudit({
            organizationId: org.id,
            actorUserId: user.id,
            action: "invitation.accepted",
            resourceType: "Invitation",
            resourceId: invitation.id,
            metadata: {
              memberId: member.id,
              email: invitation.email,
              role: member.role,
            },
          });
        },

        async afterCancelInvitation({
          invitation,
          cancelledBy,
          organization: org,
        }) {
          await recordOrganizationAudit({
            organizationId: org.id,
            actorUserId: cancelledBy.id,
            action: "invitation.cancelled",
            resourceType: "Invitation",
            resourceId: invitation.id,
            metadata: {
              email: invitation.email,
              role: invitation.role,
            },
          });
        },

        async afterRejectInvitation({ invitation, user, organization: org }) {
          await recordOrganizationAudit({
            organizationId: org.id,
            actorUserId: user.id,
            action: "invitation.rejected",
            resourceType: "Invitation",
            resourceId: invitation.id,
            metadata: {
              email: invitation.email,
              role: invitation.role,
            },
          });
        },
      },
    }),
  ],
});
