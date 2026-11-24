import { Module } from "@nestjs/common";
import { CrmModule } from "../crm/crm.module.js";
import { EmailModule } from "../email/email.module.js";
import { OrdersModule } from "../orders/orders.module.js";
import { PricingModule } from "../pricing/pricing.module.js";
import { FulfillmentNotificationsService } from "./fulfillment-notifications.service.js";
import { FulfillmentsController } from "./fulfillments.controller.js";
import { FulfillmentsService } from "./fulfillments.service.js";
import { StaffJobsController } from "./staff-jobs.controller.js";
import { StaffJobsService } from "./staff-jobs.service.js";

@Module({
  imports: [PricingModule, OrdersModule, CrmModule, EmailModule],
  controllers: [FulfillmentsController, StaffJobsController],
  providers: [
    FulfillmentsService,
    StaffJobsService,
    FulfillmentNotificationsService,
  ],
  exports: [
    FulfillmentsService,
    StaffJobsService,
    FulfillmentNotificationsService,
  ],
})
export class FulfillmentsModule {}
