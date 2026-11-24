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
    .default("postgresql://erp:erp_dev_password@localhost:5432/erp_db?schema=public"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  REDIS_KEY_PREFIX: z.string().default("erp:"),
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
    .default("NexusERP <onboarding@resend.dev>"),
});

export type AppEnv = Omit<
  z.infer<typeof envSchema>,
  "BETTER_AUTH_SECRET" | "CORS_ALLOWED_ORIGINS" | "RESEND_API_KEY"
> & {
  BETTER_AUTH_SECRET: string;
  CORS_ALLOWED_ORIGINS: string[];
  RESEND_API_KEY: string | null;
};

let cachedEnv: AppEnv | null = null;
const ephemeralDevSecret = randomBytes(32).toString("hex");

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.parse(process.env);

  if (
    parsed.NODE_ENV === "production" &&
    (!parsed.BETTER_AUTH_SECRET || parsed.BETTER_AUTH_SECRET.length < 32)
  ) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set to a strong secret (at least 32 characters) in production.",
    );
  }

  const resendApiKey =
    parsed.RESEND_API_KEY && parsed.RESEND_API_KEY.trim().length > 0
      ? parsed.RESEND_API_KEY.trim()
      : null;

  if (parsed.NODE_ENV === "production" && !resendApiKey) {
    throw new Error(
      "RESEND_API_KEY must be configured in production for email verification and invitations.",
    );
  }

  const allowedOrigins = parsed.CORS_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== "*");

  cachedEnv = {
    ...parsed,
    BETTER_AUTH_SECRET:
      parsed.BETTER_AUTH_SECRET && parsed.BETTER_AUTH_SECRET.length > 0
        ? parsed.BETTER_AUTH_SECRET
        : ephemeralDevSecret,
    CORS_ALLOWED_ORIGINS: allowedOrigins,
    RESEND_API_KEY: resendApiKey,
  };

  return cachedEnv;
}
