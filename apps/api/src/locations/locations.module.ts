import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller.js";
import { InventoryService } from "./inventory.service.js";
import { LocationsController } from "./locations.controller.js";
import { LocationsService } from "./locations.service.js";

@Module({
  controllers: [LocationsController, InventoryController],
  providers: [LocationsService, InventoryService],
  exports: [LocationsService, InventoryService],
})
export class LocationsModule {}
