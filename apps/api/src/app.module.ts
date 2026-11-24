import { Module } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth/auth.config.js";
import { MeController } from "./auth/me.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { RedisModule } from "./redis/redis.module.js";
import { TenancyModule } from "./tenancy/tenancy.module.js";
import { TenantsModule } from "./tenants/tenants.module.js";

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    TenancyModule,
    AuthModule.forRoot({
      auth,
      isGlobal: true,
      disableTrustedOriginsCors: true,
      bodyParser: {
        json: { limit: "1mb" },
        urlencoded: { limit: "1mb", extended: true },
        rawBody: true,
      },
    }),
    HealthModule,
    TenantsModule,
  ],
  controllers: [MeController],
})
export class AppModule {}
