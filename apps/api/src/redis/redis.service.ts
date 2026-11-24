import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import { getEnv } from "../config/env.js";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public readonly client: Redis;

  constructor() {
    const env = getEnv();
    this.client = new Redis(env.REDIS_URL, {
      keyPrefix: env.REDIS_KEY_PREFIX,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.client.on("error", (err: Error) => {
      this.logger.warn(`Redis connection warning: ${err.message}`);
    });
  }

  async ensureConnected(): Promise<void> {
    if (this.client.status === "wait") {
      await this.client.connect();
    }
  }

  async ping(): Promise<"PONG"> {
    await this.ensureConnected();
    return this.client.ping();
  }

  async getJson<T>(key: string): Promise<T | null> {
    await this.ensureConnected();
    const raw = await this.client.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  }

  async setJson<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.ensureConnected();
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await this.client.set(key, serialized, "EX", ttlSeconds);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.ensureConnected();
    await this.client.del(key);
  }

  async invalidateTenantCache(organizationId: string, namespace: string): Promise<void> {
    await this.del(`tenant:${organizationId}:${namespace}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== "end") {
      await this.client.quit();
    }
  }
}
