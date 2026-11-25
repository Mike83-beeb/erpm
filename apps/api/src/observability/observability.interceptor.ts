import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import type { FastifyReply } from "fastify";
import { tap, type Observable } from "rxjs";
import type { TenantScopedRequest } from "../tenancy/tenant.decorators.js";
import { AnalyticsService } from "./analytics.service.js";
import { sanitizeRequestId, scrubUrlQuery } from "./scrubbing.utils.js";

type EnrichedRequest = TenantScopedRequest & {
  requestId?: string;
  routeOptions?: { url?: string };
};

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(
    @Inject(AnalyticsService)
    private readonly analyticsService: AnalyticsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<EnrichedRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const startedAt = process.hrtime.bigint();

    const requestId =
      request.requestId ??
      sanitizeRequestId(request.headers["x-request-id"] ?? request.id);
    request.requestId = requestId;

    const organizationId =
      request.tenant?.organizationId ??
      request.authContext?.organizationId ??
      request.session?.session?.activeOrganizationId ??
      null;
    const userId = request.tenant?.userId ?? request.session?.user?.id ?? null;
    const role = request.tenant?.role ?? null;
    const authMethod =
      request.tenant?.authMethod ?? request.authContext?.authMethod ?? null;
    const principalType = request.authContext?.principalType ?? null;
    const routePattern =
      request.routeOptions?.url ??
      scrubUrlQuery(request.url.split("?")[0] ?? request.url);

    const isolationScope = Sentry.getIsolationScope();
    isolationScope.setTag("request_id", requestId);
    isolationScope.setTag("http.route", routePattern);
    isolationScope.setTag("http.method", request.method);
    if (organizationId) {
      isolationScope.setTag("organization_id", organizationId);
    }
    if (userId) {
      isolationScope.setUser({ id: userId });
      isolationScope.setTag("user_id", userId);
    }
    if (role) {
      isolationScope.setTag("organization_role", role);
    }
    if (authMethod) {
      isolationScope.setTag("auth_method", authMethod);
    }
    if (principalType) {
      isolationScope.setTag("principal_type", principalType);
    }

    if (organizationId && this.analyticsService.isEnabled()) {
      this.analyticsService.identifyOrganization({
        organizationId,
        distinctId: userId,
        properties: {
          auth_method: authMethod ?? undefined,
          principal_type: principalType ?? undefined,
        },
      });
    }

    return next.handle().pipe(
      tap(() => {
        // Re-enrich after controller/TenantInterceptor in case TenantGuard populated tenant lazily
        const resolvedOrgId =
          request.tenant?.organizationId ?? organizationId ?? null;
        const resolvedUserId = request.tenant?.userId ?? userId ?? null;
        const resolvedRole = request.tenant?.role ?? role ?? null;

        if (resolvedOrgId) {
          isolationScope.setTag("organization_id", resolvedOrgId);
        }
        if (resolvedUserId) {
          isolationScope.setUser({ id: resolvedUserId });
          isolationScope.setTag("user_id", resolvedUserId);
        }
        if (resolvedRole) {
          isolationScope.setTag("organization_role", resolvedRole);
        }

        const durationMs =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const statusCode = reply.statusCode ?? 200;

        if (statusCode >= 400 && !routePattern.startsWith("/api/v1/health")) {
          this.analyticsService.captureDomainEvent({
            event: "api.request.completed_with_error_status",
            distinctId: resolvedUserId,
            organizationId: resolvedOrgId,
            properties: {
              status_code: statusCode,
              method: request.method,
              route: routePattern,
              duration_ms: Math.round(durationMs * 100) / 100,
              request_id: requestId,
            },
          });
        }
      }),
    );
  }
}
