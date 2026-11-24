import { Module } from "@nestjs/common";
import { PricingModule } from "../pricing/pricing.module.js";
import { InvoicesController } from "./invoices.controller.js";
import { InvoicesPaymentsService } from "./invoices-payments.service.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";
import { ReceiptsController } from "./receipts.controller.js";

@Module({
  imports: [PricingModule],
  controllers: [OrdersController, InvoicesController, ReceiptsController],
  providers: [OrdersService, InvoicesPaymentsService],
  exports: [OrdersService, InvoicesPaymentsService],
})
export class OrdersModule {}
