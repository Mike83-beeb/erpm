import { Module } from "@nestjs/common";
import { PricingCatalogService } from "./pricing-catalog.service.js";
import { PricingEngineService } from "./pricing-engine.service.js";
import { PricingController } from "./pricing.controller.js";

@Module({
  controllers: [PricingController],
  providers: [PricingCatalogService, PricingEngineService],
  exports: [PricingCatalogService, PricingEngineService],
})
export class PricingModule {}
