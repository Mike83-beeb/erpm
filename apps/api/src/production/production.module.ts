import { Module } from "@nestjs/common";
import { LocationsModule } from "../locations/locations.module.js";
import { ProductionEngineeringController } from "./engineering.controller.js";
import { ProductionEngineeringService } from "./engineering.service.js";
import { ProductionExecutionController } from "./production-execution.controller.js";
import { ProductionExecutionService } from "./production-execution.service.js";
import { ProductionController } from "./production.controller.js";
import { ProductionService } from "./production.service.js";

@Module({
  imports: [LocationsModule],
  controllers: [
    ProductionEngineeringController,
    ProductionExecutionController,
    ProductionController,
  ],
  providers: [
    ProductionEngineeringService,
    ProductionExecutionService,
    ProductionService,
  ],
  exports: [
    ProductionEngineeringService,
    ProductionExecutionService,
    ProductionService,
  ],
})
export class ProductionModule {}
