import { resolve } from "node:path";
import { Readable } from "node:stream";
import dotenv from "dotenv";
import "reflect-metadata";

dotenv.config({ path: resolve(process.cwd(), "../../.env") });
dotenv.config();
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import { authRedisClient } from "./auth/auth.config.js";
import { getEnv } from "./config/env.js";

async function bootstrap() {
  const env = getEnv();
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: env.NODE_ENV !== "test",
      trustProxy: true,
      ignoreTrailingSlash: true,
    }),
    {
      bodyParser: false,
    },
  );

  await app.register(cors, {
    origin: env.CORS_ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-API-Key"],
  });

  await app.register(multipart, {
    limits: {
      fileSize: env.STORAGE_MAX_FILE_BYTES,
      files: 1,
    },
  });

  app.enableShutdownHooks();

  const fastifyInstance = app.getHttpAdapter().getInstance();

  fastifyInstance.addHook("preParsing", async (request, _reply, payload) => {
    if (
      request.method !== "POST" ||
      !request.url.startsWith("/api/v1/crm/webhooks/")
    ) {
      return payload;
    }
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    const maxBytes = 1024 * 1024;
    for await (const chunk of payload) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.byteLength;
      if (totalBytes > maxBytes) {
        const err = new Error("Webhook payload exceeds 1 MiB limit.") as Error & {
          statusCode?: number;
        };
        err.statusCode = 413;
        throw err;
      }
      chunks.push(buf);
    }
    const rawBuffer = Buffer.concat(chunks);
    (request as unknown as { crmRawBody?: Buffer }).crmRawBody = rawBuffer;
    return Readable.from(rawBuffer);
  });

  fastifyInstance.addHook("onClose", async () => {
    if (authRedisClient.status !== "end") {
      await authRedisClient.quit();
    }
  });

  await app.listen(3000, "0.0.0.0");
  logger.log("Scace API (Fastify) listening on http://0.0.0.0:3000");
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start Scace API:", error);
  process.exit(1);
});
