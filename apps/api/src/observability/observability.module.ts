import { Global, Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service.js";
import { EnterpriseExceptionFilter } from "./enterprise-exception.filter.js";
import { FeatureFlagGuard } from "./feature-flag.guard.js";
import { ObservabilityController } from "./observability.controller.js";
import { ObservabilityInterceptor } from "./observability.interceptor.js";
import { SentryService } from "./sentry.service.js";

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [
    SentryService,
    AnalyticsService,
    FeatureFlagGuard,
    ObservabilityInterceptor,
    EnterpriseExceptionFilter,
  ],
  exports: [
    SentryService,
    AnalyticsService,
    FeatureFlagGuard,
    ObservabilityInterceptor,
    EnterpriseExceptionFilter,
  ],
})
export class ObservabilityModule {}
