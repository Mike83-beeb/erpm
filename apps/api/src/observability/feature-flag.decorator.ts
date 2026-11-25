import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { FeatureFlagGuard } from "./feature-flag.guard.js";

export const FEATURE_FLAG_METADATA_KEY = "scace:require_feature_flag";

export interface FeatureFlagRequirement {
  flagKey: string;
  defaultEnabled?: boolean;
  errorMessage?: string;
}

export const RequireFeatureFlag = (
  flagKey: string,
  options?: { defaultEnabled?: boolean; errorMessage?: string },
) =>
  applyDecorators(
    SetMetadata(FEATURE_FLAG_METADATA_KEY, {
      flagKey,
      defaultEnabled: options?.defaultEnabled ?? false,
      errorMessage: options?.errorMessage,
    } satisfies FeatureFlagRequirement),
    UseGuards(FeatureFlagGuard),
  );
