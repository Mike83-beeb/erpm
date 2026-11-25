import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { MpesaPaymentService } from "./mpesa-payment.service.js";

const stkCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string().trim().min(1),
      CheckoutRequestID: z.string().trim().min(1),
      ResultCode: z.coerce.number().int(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z
            .array(
              z.object({
                Name: z.string(),
                Value: z.union([z.string(), z.number(), z.null()]).optional(),
              }),
            )
            .optional(),
        })
        .optional(),
    }),
  }),
});

const c2bWebhookSchema = z.object({
  TransactionType: z.string().optional(),
  TransID: z.string().trim().min(1),
  TransTime: z.string().optional(),
  TransAmount: z.union([z.string().min(1), z.number().positive()]),
  BusinessShortCode: z.string().trim().min(1),
  BillRefNumber: z.string().optional(),
  InvoiceNumber: z.string().optional(),
  OrgAccountBalance: z.union([z.string(), z.number()]).optional(),
  ThirdPartyTransID: z.string().optional(),
  MSISDN: z.string().optional(),
  FirstName: z.string().optional(),
  MiddleName: z.string().optional(),
  LastName: z.string().optional(),
});

@Controller("api/v1/webhooks/daraja/o/:orgToken")
@AllowAnonymous()
export class MpesaWebhookController {
  constructor(
    @Inject(MpesaPaymentService)
    private readonly paymentService: MpesaPaymentService,
  ) {}

  @Post("stk/:txToken")
  @HttpCode(200)
  async handleStkCallback(
    @Param("orgToken") orgToken: string,
    @Param("txToken") txToken: string,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = stkCallbackSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid Daraja STK callback payload.",
        issues: parsed.error.issues,
      });
    }

    return this.paymentService.handleStkCallback({
      orgToken,
      txToken,
      payload: parsed.data,
      clientIp: req.ip,
    });
  }

  @Post("c2b/validate")
  @HttpCode(200)
  async handleC2bValidation(
    @Param("orgToken") orgToken: string,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = c2bWebhookSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid Daraja C2B validation payload.",
        issues: parsed.error.issues,
      });
    }

    return this.paymentService.handleC2bValidation({
      orgToken,
      payload: parsed.data,
      clientIp: req.ip,
    });
  }

  @Post("c2b/confirm")
  @HttpCode(200)
  async handleC2bConfirmation(
    @Param("orgToken") orgToken: string,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = c2bWebhookSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid Daraja C2B confirmation payload.",
        issues: parsed.error.issues,
      });
    }

    return this.paymentService.handleC2bConfirmation({
      orgToken,
      payload: parsed.data,
      clientIp: req.ip,
    });
  }
}
