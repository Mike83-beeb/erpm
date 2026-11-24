import { Global, Module } from "@nestjs/common";
import { emailDelivery, EmailService } from "./email.service.js";

@Global()
@Module({
  providers: [
    {
      provide: EmailService,
      useValue: emailDelivery,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
