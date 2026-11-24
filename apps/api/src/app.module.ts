import { Module } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth/auth.config.js";
import { MeController } from "./auth/me.controller.js";
import { CrmModule } from "./crm/crm.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { EmailModule } from "./email/email.module.js";
import { HealthModule } from "./health/health.module.js";
import { ItemsModule } from "./items/items.module.js";
import { LocationsModule } from "./locations/locations.module.js";
import { ProcurementModule } from "./procurement/procurement.module.js";
import { RedisModule } from "./redis/redis.module.js";
import { StaffModule } from "./staff/staff.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { TenancyModule } from "./tenancy/tenancy.module.js";
import { TenantsModule } from "./tenants/tenants.module.js";

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    StorageModule,
    EmailModule,
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
    ItemsModule,
    LocationsModule,
    ProcurementModule,
    StaffModule,
    CrmModule,
  ],
  controllers: [MeController],
})
export class AppModule {}
