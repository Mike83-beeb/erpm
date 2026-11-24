import { Module } from "@nestjs/common";
import { PricingModule } from "../pricing/pricing.module.js";
import { DeliveriesController } from "./deliveries.controller.js";
import { DeliveriesService } from "./deliveries.service.js";
import { PurchaseOrdersController } from "./purchase-orders.controller.js";
import { PurchaseOrdersService } from "./purchase-orders.service.js";
import { SuppliersController } from "./suppliers.controller.js";
import { SuppliersService } from "./suppliers.service.js";
import { VendorBillsController } from "./vendor-bills.controller.js";
import { VendorBillsService } from "./vendor-bills.service.js";

@Module({
  imports: [PricingModule],
  controllers: [
    SuppliersController,
    PurchaseOrdersController,
    DeliveriesController,
    VendorBillsController,
  ],
  providers: [
    SuppliersService,
    PurchaseOrdersService,
    DeliveriesService,
    VendorBillsService,
  ],
  exports: [
    SuppliersService,
    PurchaseOrdersService,
    DeliveriesService,
    VendorBillsService,
  ],
})
export class ProcurementModule {}
