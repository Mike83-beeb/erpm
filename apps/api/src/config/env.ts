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
});

export type AppEnv = Omit<z.infer<typeof envSchema>, "BETTER_AUTH_SECRET" | "CORS_ALLOWED_ORIGINS"> & {
  BETTER_AUTH_SECRET: string;
  CORS_ALLOWED_ORIGINS: string[];
};

let cachedEnv: AppEnv | null = null;
const ephemeralDevSecret = randomBytes(32).toString("hex");

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.parse(process.env);

  if (parsed.NODE_ENV === "production" && (!parsed.BETTER_AUTH_SECRET || parsed.BETTER_AUTH_SECRET.length < 32)) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set to a strong secret (at least 32 characters) in production.",
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
  };

  return cachedEnv;
}
