import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { PostHog } from "posthog-node";
import { getEnv } from "../config/env.js";
import { sanitizeAnalyticsProperties } from "./scrubbing.utils.js";

export interface DomainEventInput {
  event: string;
  distinctId?: string | null;
  organizationId?: string | null;
  properties?: Record<string, unknown>;
}

export interface IdentifyOrganizationInput {
  organizationId: string;
  distinctId?: string | null;
  properties?: Record<string, unknown>;
  force?: boolean;
}

export interface FeatureFlagEvaluationInput {
  key: string;
  distinctId: string;
  organizationId?: string | null;
  personProperties?: Record<string, string | number | boolean>;
  groupProperties?: Record<string, Record<string, string | number | boolean>>;
  defaultValue?: boolean;
}

export interface EvaluatedFeatureFlag {
  key: string;
  enabled: boolean;
  variant: string | null;
  payload: unknown;
  evaluated: boolean;
  source: "posthog" | "noop";
}

export interface PostHogStatusSnapshot {
  enabled: boolean;
  host: string;
  localEvaluationConfigured: boolean;
}

const ORG_IDENTIFY_TTL_MS = 10 * 60 * 1000;
const ORG_IDENTIFY_CACHE_MAX = 2000;
const FLAG_LOOKUP_TIMEOUT_MS = 3000;

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name);
  private client: PostHog | null = null;
  private readonly orgIdentifyCache = new Map<string, number>();

  onModuleInit(): void {
    const env = getEnv();
    if (!env.POSTHOG_ENABLED || !env.POSTHOG_API_KEY) {
      return;
    }

    try {
      this.client = new PostHog(env.POSTHOG_API_KEY, {
        host: env.POSTHOG_HOST,
        secretKey: env.POSTHOG_PERSONAL_API_KEY ?? undefined,
        enableLocalEvaluation: Boolean(env.POSTHOG_PERSONAL_API_KEY),
        disableGeoip: true,
        requestTimeout: 5000,
        flushAt: 20,
        flushInterval: 5000,
        beforeSend: (event) => {
          if (event.properties) {
            event.properties = sanitizeAnalyticsProperties(
              event.properties as Record<string, unknown>,
            );
          }
          return event;
        },
      });

      this.client.on("error", (err: unknown) => {
        this.logger.warn(
          `PostHog background client error: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    } catch (err) {
      this.logger.warn(
        `Failed to initialize PostHog client; running in no-op mode: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }
    try {
      await this.client._shutdown(2500);
    } catch (err) {
      this.logger.warn(
        `PostHog shutdown warning: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.client = null;
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getStatus(): PostHogStatusSnapshot {
    const env = getEnv();
    return {
      enabled: this.isEnabled(),
      host: env.POSTHOG_HOST,
      localEvaluationConfigured: Boolean(
        this.isEnabled() && env.POSTHOG_PERSONAL_API_KEY,
      ),
    };
  }

  captureDomainEvent(input: DomainEventInput): void {
    if (!this.client) {
      return;
    }

    try {
      const env = getEnv();
      const distinctId =
        input.distinctId && input.distinctId.trim().length > 0
          ? input.distinctId.trim()
          : input.organizationId
            ? `org:${input.organizationId}`
            : "system:scace-api";

      const properties = sanitizeAnalyticsProperties({
        ...(input.properties ?? {}),
        environment: env.NODE_ENV,
        ...(input.organizationId ? { organization_id: input.organizationId } : {}),
      });

      this.client.capture({
        distinctId,
        event: input.event,
        groups: input.organizationId
          ? { organization: input.organizationId }
          : undefined,
        properties,
        disableGeoip: true,
      });
    } catch (err) {
      this.logger.debug(
        `Skipped PostHog capture (${input.event}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  identifyOrganization(input: IdentifyOrganizationInput): void {
    if (!this.client || !input.organizationId) {
      return;
    }

    const now = Date.now();
    const lastSeen = this.orgIdentifyCache.get(input.organizationId);
    if (!input.force && lastSeen && now - lastSeen < ORG_IDENTIFY_TTL_MS) {
      return;
    }

    if (this.orgIdentifyCache.size >= ORG_IDENTIFY_CACHE_MAX) {
      const firstKey = this.orgIdentifyCache.keys().next().value;
      if (firstKey) {
        this.orgIdentifyCache.delete(firstKey);
      }
    }
    this.orgIdentifyCache.set(input.organizationId, now);

    try {
      const properties = sanitizeAnalyticsProperties({
        organization_id: input.organizationId,
        ...(input.properties ?? {}),
      });

      this.client.groupIdentify({
        groupType: "organization",
        groupKey: input.organizationId,
        distinctId: input.distinctId ?? undefined,
        properties,
        disableGeoip: true,
      });
    } catch (err) {
      this.logger.debug(
        `Skipped PostHog groupIdentify (${input.organizationId}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  identifyUser(
    distinctId: string,
    properties?: Record<string, unknown>,
  ): void {
    if (!this.client || !distinctId) {
      return;
    }

    try {
      this.client.identify({
        distinctId,
        properties: sanitizeAnalyticsProperties(properties),
        disableGeoip: true,
      });
    } catch {
      // Non-fatal telemetry guard
    }
  }

  async getFeatureFlagResult(
    input: FeatureFlagEvaluationInput,
  ): Promise<EvaluatedFeatureFlag> {
    const defaultValue = input.defaultValue ?? false;
    if (!this.client) {
      return {
        key: input.key,
        enabled: defaultValue,
        variant: null,
        payload: null,
        evaluated: false,
        source: "noop",
      };
    }

    try {
      const evaluationPromise = this.client.getFeatureFlagResult(
        input.key,
        input.distinctId,
        {
          groups: input.organizationId
            ? { organization: input.organizationId }
            : undefined,
          personProperties: input.personProperties,
          groupProperties: input.groupProperties,
          disableGeoip: true,
        },
      );

      let timer: ReturnType<typeof setTimeout> | undefined;
      const result = await Promise.race([
        evaluationPromise,
        new Promise<undefined>((resolve) => {
          timer = setTimeout(() => resolve(undefined), FLAG_LOOKUP_TIMEOUT_MS);
        }),
      ]).finally(() => {
        if (timer) {
          clearTimeout(timer);
        }
      });

      if (!result) {
        return {
          key: input.key,
          enabled: defaultValue,
          variant: null,
          payload: null,
          evaluated: false,
          source: "posthog",
        };
      }

      return {
        key: result.key,
        enabled: result.enabled,
        variant: result.variant ?? null,
        payload: result.payload ?? null,
        evaluated: true,
        source: "posthog",
      };
    } catch (err) {
      this.logger.warn(
        `PostHog feature flag evaluation failed for '${input.key}': ${err instanceof Error ? err.message : String(err)}`,
      );
      return {
        key: input.key,
        enabled: defaultValue,
        variant: null,
        payload: null,
        evaluated: false,
        source: "posthog",
      };
    }
  }

  async isFeatureEnabled(input: FeatureFlagEvaluationInput): Promise<boolean> {
    const result = await this.getFeatureFlagResult(input);
    return result.enabled;
  }

  async getAllFlagsAndPayloads(input: {
    distinctId: string;
    organizationId?: string | null;
    flagKeys?: string[];
    personProperties?: Record<string, string | number | boolean>;
    groupProperties?: Record<string, Record<string, string | number | boolean>>;
  }): Promise<{
    enabled: boolean;
    flags: Record<string, boolean | string>;
    payloads: Record<string, unknown>;
  }> {
    if (!this.client) {
      return {
        enabled: false,
        flags: {},
        payloads: {},
      };
    }

    try {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const response = await Promise.race([
        this.client.getAllFlagsAndPayloads(input.distinctId, {
          groups: input.organizationId
            ? { organization: input.organizationId }
            : undefined,
          flagKeys: input.flagKeys,
          personProperties: input.personProperties,
          groupProperties: input.groupProperties,
          disableGeoip: true,
        }),
        new Promise<undefined>((resolve) => {
          timer = setTimeout(() => resolve(undefined), FLAG_LOOKUP_TIMEOUT_MS);
        }),
      ]).finally(() => {
        if (timer) {
          clearTimeout(timer);
        }
      });

      if (!response) {
        return {
          enabled: true,
          flags: {},
          payloads: {},
        };
      }

      const rawFlags = (response.featureFlags ?? {}) as Record<
        string,
        boolean | string | undefined
      >;
      const cleanFlags: Record<string, boolean | string> = {};
      for (const [key, val] of Object.entries(rawFlags)) {
        if (val !== undefined) {
          cleanFlags[key] = val;
        }
      }

      return {
        enabled: true,
        flags: cleanFlags,
        payloads: (response.featureFlagPayloads ?? {}) as Record<string, unknown>,
      };
    } catch (err) {
      this.logger.warn(
        `PostHog bulk feature flag evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return {
        enabled: true,
        flags: {},
        payloads: {},
      };
    }
  }
}
