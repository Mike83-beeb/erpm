import { Module } from "@nestjs/common";
import { PurchaseOrdersController } from "./purchase-orders.controller.js";
import { PurchaseOrdersService } from "./purchase-orders.service.js";
import { SuppliersController } from "./suppliers.controller.js";
import { SuppliersService } from "./suppliers.service.js";
import { VendorBillsController } from "./vendor-bills.controller.js";
import { VendorBillsService } from "./vendor-bills.service.js";

@Module({
  controllers: [
    SuppliersController,
    PurchaseOrdersController,
    VendorBillsController,
  ],
  providers: [SuppliersService, PurchaseOrdersService, VendorBillsService],
  exports: [SuppliersService, PurchaseOrdersService, VendorBillsService],
})
export class ProcurementModule {}
