import { resolve } from "node:path";
import dotenv from "dotenv";
import "reflect-metadata";

dotenv.config({ path: resolve(process.cwd(), "../../.env") });
dotenv.config();
import cors from "@fastify/cors";
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
    }),
    {
      bodyParser: false,
    },
  );

  await app.register(cors, {
    origin: env.CORS_ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  app.enableShutdownHooks();

  const fastifyInstance = app.getHttpAdapter().getInstance();
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
