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

  const allowedOrigins = parsed.CORS_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== "*");

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
  };

  return cachedEnv;
}
