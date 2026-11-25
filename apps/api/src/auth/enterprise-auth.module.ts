import { Global, Module } from "@nestjs/common";
import { OAuthClientsController } from "./oauth-clients.controller.js";
import { OAuthClientsService } from "./oauth-clients.service.js";
import { OAuthProviderController } from "./oauth-provider.controller.js";
import { OAuthProviderService } from "./oauth-provider.service.js";
import { PatController } from "./pat.controller.js";
import { PatService } from "./pat.service.js";
import { SsoController } from "./sso.controller.js";
import { SsoService } from "./sso.service.js";
import { UnifiedAuthGuard } from "./unified-auth.guard.js";

@Global()
@Module({
  controllers: [
    PatController,
    OAuthClientsController,
    OAuthProviderController,
    SsoController,
  ],
  providers: [
    PatService,
    OAuthClientsService,
    OAuthProviderService,
    SsoService,
    UnifiedAuthGuard,
  ],
  exports: [
    PatService,
    OAuthClientsService,
    OAuthProviderService,
    SsoService,
    UnifiedAuthGuard,
  ],
})
export class EnterpriseAuthModule {}
