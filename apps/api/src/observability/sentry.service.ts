import { Inject, Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { getEnv } from "../config/env.js";
import { scrubObject, scrubStringValue } from "./scrubbing.utils.js";

export interface SentryCaptureContext {
  statusCode: number;
  errorCode: string;
  requestId: string;
  organizationId?: string | null;
  userId?: string | null;
  role?: string | null;
  authMethod?: string | null;
  method?: string;
  route?: string;
  path?: string;
  extra?: Record<string, unknown>;
}

export interface SentryStatusSnapshot {
  enabled: boolean;
  environment: string;
  release: string | null;
  capture4xx: boolean;
  tracesSampleRate: number;
}

@Injectable()
export class SentryService implements OnModuleDestroy {
  private readonly logger = new Logger(SentryService.name);

  constructor() {}

  isEnabled(): boolean {
    const env = getEnv();
    return Boolean(env.SENTRY_DSN && Sentry.getClient());
  }

  getStatus(): SentryStatusSnapshot {
    const env = getEnv();
    return {
      enabled: this.isEnabled(),
      environment: env.SENTRY_ENVIRONMENT,
      release: env.SENTRY_RELEASE,
      capture4xx: env.SENTRY_CAPTURE_4XX,
      tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    };
  }

  captureException(
    exception: unknown,
    context: SentryCaptureContext,
  ): string | null {
    const env = getEnv();
    if (!this.isEnabled()) {
      return null;
    }

    const isClientError = context.statusCode >= 400 && context.statusCode < 500;
    if (isClientError && !env.SENTRY_CAPTURE_4XX) {
      return null;
    }

    try {
      return Sentry.withScope((scope) => {
        scope.setLevel(context.statusCode >= 500 ? "error" : "warning");
        scope.setTag("request_id", context.requestId);
        scope.setTag("http.status_code", String(context.statusCode));
        scope.setTag(
          "error.class",
          context.statusCode >= 500 ? "5xx" : "4xx",
        );
        scope.setTag("error.code", context.errorCode);

        if (context.organizationId) {
          scope.setTag("organization_id", context.organizationId);
        }
        if (context.userId) {
          scope.setUser({ id: context.userId });
          scope.setTag("user_id", context.userId);
        }
        if (context.role) {
          scope.setTag("organization_role", context.role);
        }
        if (context.authMethod) {
          scope.setTag("auth_method", context.authMethod);
        }
        if (context.method) {
          scope.setTag("http.method", context.method);
        }
        if (context.route) {
          scope.setTag("http.route", context.route);
        }

        scope.setContext("request_correlation", {
          requestId: context.requestId,
          path: context.path ? scrubStringValue(context.path) : undefined,
          route: context.route,
          method: context.method,
          statusCode: context.statusCode,
          errorCode: context.errorCode,
        });

        if (context.extra) {
          scope.setExtras(scrubObject(context.extra));
        }

        const errorToCapture =
          exception instanceof Error
            ? exception
            : new Error(
                typeof exception === "string"
                  ? scrubStringValue(exception)
                  : `${context.errorCode} (${context.statusCode})`,
              );

        return Sentry.captureException(errorToCapture);
      });
    } catch (err) {
      this.logger.warn(
        `Failed to capture exception in Sentry: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  captureMessage(
    message: string,
    level: "info" | "warning" | "error" = "info",
    tags?: Record<string, string>,
  ): string | null {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      return Sentry.withScope((scope) => {
        scope.setLevel(level);
        if (tags) {
          for (const [k, v] of Object.entries(tags)) {
            scope.setTag(k, scrubStringValue(v));
          }
        }
        return Sentry.captureMessage(scrubStringValue(message));
      });
    } catch {
      return null;
    }
  }

  async flush(timeoutMs = 2000): Promise<boolean> {
    if (!this.isEnabled()) {
      return true;
    }
    try {
      return await Sentry.flush(timeoutMs);
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.flush(2000);
  }
}

export type SentryServiceType = SentryService;
void Inject;
