import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: resolve(process.cwd(), "../../.env") });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().min(1).default("0.0.0.0"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://scace:scace_dev_password@localhost:5432/scace_db?schema=public"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  REDIS_KEY_PREFIX: z.string().default("scace:"),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:5173"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .trim()
    .min(1)
    .default("Scace <onboarding@resend.dev>"),
  RUSTFS_ENDPOINT: z.string().url().default("http://localhost:9000"),
  RUSTFS_PUBLIC_ENDPOINT: z.string().url().optional(),
  RUSTFS_REGION: z.string().trim().min(1).default("us-east-1"),
  RUSTFS_ACCESS_KEY: z.string().optional(),
  RUSTFS_SECRET_KEY: z.string().optional(),
  RUSTFS_BUCKET_PREFIX: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[a-z0-9-]+$/)
    .default("scace-org-"),
  STORAGE_DEFAULT_QUOTA_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(1_073_741_824),
  STORAGE_MAX_FILE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(104_857_600),
  STORAGE_PRESIGN_EXPIRES_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(3600)
    .default(900),
  CRM_ENCRYPTION_KEY: z.string().optional(),
  CRM_ALLOW_PRIVATE_URLS: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  CRM_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(10000),
});

export type AppEnv = Omit<
  z.infer<typeof envSchema>,
  | "BETTER_AUTH_SECRET"
  | "CORS_ALLOWED_ORIGINS"
  | "RESEND_API_KEY"
  | "RUSTFS_ACCESS_KEY"
  | "RUSTFS_SECRET_KEY"
  | "RUSTFS_PUBLIC_ENDPOINT"
  | "CRM_ENCRYPTION_KEY"
  | "CRM_ALLOW_PRIVATE_URLS"
> & {
  BETTER_AUTH_SECRET: string;
  CORS_ALLOWED_ORIGINS: string[];
  RESEND_API_KEY: string | null;
  RUSTFS_ACCESS_KEY: string | null;
  RUSTFS_SECRET_KEY: string | null;
  RUSTFS_PUBLIC_ENDPOINT: string;
  CRM_ENCRYPTION_KEY: string | null;
  CRM_ALLOW_PRIVATE_URLS: boolean;
};

let cachedEnv: AppEnv | null = null;
const ephemeralDevSecret = randomBytes(32).toString("hex");

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.parse(process.env);
  const nginxPort = process.env.NGINX_PORT ? Number(process.env.NGINX_PORT) : undefined;
  const resolvedPort =
    nginxPort && parsed.PORT === nginxPort
      ? Number(process.env.DEFAULT_APP_PORT || 3000)
      : parsed.PORT;

  if (
    parsed.NODE_ENV === "production" &&
    (!parsed.BETTER_AUTH_SECRET || parsed.BETTER_AUTH_SECRET.length < 32)
  ) {
    console.warn(
      "[AI Studio] BETTER_AUTH_SECRET not configured (>=32 chars) — using ephemeral fallback secret.",
    );
  }

  const resendApiKey =
    parsed.RESEND_API_KEY && parsed.RESEND_API_KEY.trim().length > 0
      ? parsed.RESEND_API_KEY.trim()
      : null;

  if (parsed.NODE_ENV === "production" && !resendApiKey) {
    console.warn(
      "[AI Studio] RESEND_API_KEY not configured — email delivery will log to console fallback.",
    );
  }

  const rustfsAccessKey =
    parsed.RUSTFS_ACCESS_KEY && parsed.RUSTFS_ACCESS_KEY.trim().length > 0
      ? parsed.RUSTFS_ACCESS_KEY.trim()
      : null;

  const rustfsSecretKey =
    parsed.RUSTFS_SECRET_KEY && parsed.RUSTFS_SECRET_KEY.trim().length > 0
      ? parsed.RUSTFS_SECRET_KEY.trim()
      : null;

  const allowedOrigins = parsed.CORS_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== "*");

  const crmEncryptionKey =
    parsed.CRM_ENCRYPTION_KEY && parsed.CRM_ENCRYPTION_KEY.trim().length > 0
      ? parsed.CRM_ENCRYPTION_KEY.trim()
      : null;

  cachedEnv = {
    ...parsed,
    PORT: resolvedPort,
    HOST: "0.0.0.0",
    BETTER_AUTH_SECRET:
      parsed.BETTER_AUTH_SECRET && parsed.BETTER_AUTH_SECRET.length > 0
        ? parsed.BETTER_AUTH_SECRET
        : ephemeralDevSecret,
    CORS_ALLOWED_ORIGINS: allowedOrigins,
    RESEND_API_KEY: resendApiKey,
    RUSTFS_ACCESS_KEY: rustfsAccessKey,
    RUSTFS_SECRET_KEY: rustfsSecretKey,
    RUSTFS_PUBLIC_ENDPOINT: parsed.RUSTFS_PUBLIC_ENDPOINT ?? parsed.RUSTFS_ENDPOINT,
    CRM_ENCRYPTION_KEY: crmEncryptionKey,
    CRM_ALLOW_PRIVATE_URLS: parsed.CRM_ALLOW_PRIVATE_URLS ?? false,
  };

  return cachedEnv;
}
