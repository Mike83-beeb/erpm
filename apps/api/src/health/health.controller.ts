import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { PrismaService } from "../database/prisma.service.js";
import { RedisService } from "../redis/redis.service.js";
import { RustfsService } from "../storage/rustfs.service.js";

@Controller("api/v1/health")
export class HealthController {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(RustfsService) private readonly rustfsService: RustfsService,
  ) {}

  @Get()
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  async check() {
    const checks = {
      postgres: "down" as "up" | "down",
      redis: "down" as "up" | "down",
      rustfs: "down" as "up" | "down",
    };

    try {
      await this.prismaService.ping();
      checks.postgres = "up";
    } catch {
      checks.postgres = "down";
    }

    try {
      const pong = await this.redisService.ping();
      checks.redis = pong === "PONG" ? "up" : "down";
    } catch {
      checks.redis = "down";
    }

    try {
      const ok = await this.rustfsService.ping();
      checks.rustfs = ok ? "up" : "down";
    } catch {
      checks.rustfs = "down";
    }

    const healthy =
      checks.postgres === "up" &&
      checks.redis === "up" &&
      checks.rustfs === "up";
    const payload = {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: checks,
    };

    if (!healthy) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }
}
