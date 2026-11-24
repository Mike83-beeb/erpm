import { Module } from "@nestjs/common";
import { PricingModule } from "../pricing/pricing.module.js";
import { CrmBridgeService } from "./crm-bridge.service.js";
import { CrmConnectionService } from "./crm-connection.service.js";
import { CrmController } from "./crm.controller.js";
import { CrmProxyService } from "./crm-proxy.service.js";
import { CrmWebhookService } from "./crm-webhook.service.js";
import { CustomerMatesClient } from "./customermates.client.js";

@Module({
  imports: [PricingModule],
  controllers: [CrmController],
  providers: [
    CustomerMatesClient,
    CrmConnectionService,
    CrmBridgeService,
    CrmProxyService,
    CrmWebhookService,
  ],
  exports: [
    CustomerMatesClient,
    CrmConnectionService,
    CrmBridgeService,
    CrmProxyService,
    CrmWebhookService,
  ],
})
export class CrmModule {}
