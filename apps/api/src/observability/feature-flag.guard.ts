import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { TenantScopedRequest } from "../tenancy/tenant.decorators.js";
import { AnalyticsService } from "./analytics.service.js";
import {
  FEATURE_FLAG_METADATA_KEY,
  type FeatureFlagRequirement,
} from "./feature-flag.decorator.js";

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AnalyticsService)
    private readonly analyticsService: AnalyticsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement =
      this.reflector.getAllAndOverride<FeatureFlagRequirement | undefined>(
        FEATURE_FLAG_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantScopedRequest>();
    const organizationId =
      request.tenant?.organizationId ??
      request.authContext?.organizationId ??
      request.session?.session?.activeOrganizationId ??
      null;
    const distinctId =
      request.tenant?.userId ??
      request.session?.user?.id ??
      (organizationId ? `org:${organizationId}` : "anonymous");

    const enabled = await this.analyticsService.isFeatureEnabled({
      key: requirement.flagKey,
      distinctId,
      organizationId,
      defaultValue: requirement.defaultEnabled ?? false,
      personProperties: request.tenant?.role
        ? { role: request.tenant.role }
        : undefined,
    });

    if (!enabled) {
      throw new ForbiddenException({
        code: "FEATURE_FLAG_DISABLED",
        message:
          requirement.errorMessage ??
          `Feature '${requirement.flagKey}' is not enabled for this organization.`,
      });
    }

    return true;
  }
}
