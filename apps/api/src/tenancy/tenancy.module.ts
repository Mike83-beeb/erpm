import { Global, Module } from "@nestjs/common";
import { TenantGuard } from "./tenant.guard.js";
import { TenantInterceptor } from "./tenant.interceptor.js";

@Global()
@Module({
  providers: [TenantGuard, TenantInterceptor],
  exports: [TenantGuard, TenantInterceptor],
})
export class TenancyModule {}
