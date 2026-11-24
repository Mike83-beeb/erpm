import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { SalesInvoiceStatus } from "@scace/db";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  CurrentTenant,
  RequireActiveTenant,
  RequiredOrgPermissions,
  type AuthenticatedTenant,
} from "../tenancy/tenant.decorators.js";
import {
  renderInvoiceHtml,
  renderInvoicePdf,
} from "./document-renderer.utils.js";
import { InvoicesPaymentsService } from "./invoices-payments.service.js";

const dateStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: "Must be a valid ISO date or datetime string.",
  });

const listInvoicesQuerySchema = z.object({
  status: z
    .enum([
      SalesInvoiceStatus.DRAFT,
      SalesInvoiceStatus.ISSUED,
      SalesInvoiceStatus.PARTIALLY_PAID,
      SalesInvoiceStatus.PAID,
      SalesInvoiceStatus.VOID,
    ])
    .optional(),
  orderId: z.string().trim().min(1).optional(),
  customerId: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
});

const issueInvoiceSchema = z.object({
  dueAt: dateStringSchema.nullable().optional(),
});

const voidInvoiceSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

const recordCashPaymentSchema = z.object({
  method: z.enum(["CASH"]).optional(),
  amountCents: z.number().int().min(1).max(1_000_000_000).optional(),
  cashTenderedCents: z.number().int().min(1).max(1_000_000_000).optional(),
  reference: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

function sanitizeFilenameSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_") || "document";
}

@Controller("api/v1/invoices")
@RequireActiveTenant()
export class InvoicesController {
  constructor(
    @Inject(InvoicesPaymentsService)
    private readonly invoicesPaymentsService: InvoicesPaymentsService,
  ) {}

  @Get()
  @RequiredOrgPermissions({ invoice: ["read"] })
  async listInvoices(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Query() query: unknown,
  ) {
    const parsed = listInvoicesQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid invoice query parameters.",
        issues: parsed.error.issues,
      });
    }

    return this.invoicesPaymentsService.listInvoices(tenant, parsed.data);
  }

  @Get(":invoiceId")
  @RequiredOrgPermissions({ invoice: ["read"] })
  async getInvoice(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("invoiceId") invoiceId: string,
  ) {
    return this.invoicesPaymentsService.getInvoice(tenant, invoiceId);
  }

  @Get(":invoiceId/html")
  @RequiredOrgPermissions({ invoice: ["read"] })
  async getInvoiceHtml(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("invoiceId") invoiceId: string,
    @Res() reply: FastifyReply,
  ) {
    const doc = await this.invoicesPaymentsService.buildInvoicePrintableDocument(
      tenant,
      invoiceId,
    );
    const html = renderInvoiceHtml(doc);
    return reply
      .header("Content-Type", "text/html; charset=utf-8")
      .header("X-Content-Type-Options", "nosniff")
      .header(
        "Content-Security-Policy",
        "default-src 'none'; style-src 'unsafe-inline'",
      )
      .send(html);
  }

  @Get(":invoiceId/pdf")
  @RequiredOrgPermissions({ invoice: ["read"] })
  async getInvoicePdf(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("invoiceId") invoiceId: string,
    @Res() reply: FastifyReply,
  ) {
    const doc = await this.invoicesPaymentsService.buildInvoicePrintableDocument(
      tenant,
      invoiceId,
    );
    const pdfBuffer = renderInvoicePdf(doc);
    const safeName = sanitizeFilenameSegment(doc.invoiceNumber);
    return reply
      .header("Content-Type", "application/pdf")
      .header(
        "Content-Disposition",
        `attachment; filename="invoice-${safeName}.pdf"`,
      )
      .header("X-Content-Type-Options", "nosniff")
      .send(pdfBuffer);
  }

  @Post(":invoiceId/issue")
  @RequiredOrgPermissions({ invoice: ["issue"] })
  async issueInvoice(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("invoiceId") invoiceId: string,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = issueInvoiceSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid invoice issue payload.",
        issues: parsed.error.issues,
      });
    }

    return this.invoicesPaymentsService.issueInvoice(
      tenant,
      invoiceId,
      parsed.data.dueAt,
      req.ip,
    );
  }

  @Post(":invoiceId/payments")
  @RequiredOrgPermissions({ payment: ["record"] })
  async recordCashPayment(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("invoiceId") invoiceId: string,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = recordCashPaymentSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid cash payment payload.",
        issues: parsed.error.issues,
      });
    }

    return this.invoicesPaymentsService.recordCashPayment(
      tenant,
      invoiceId,
      parsed.data,
      req.ip,
    );
  }

  @Post(":invoiceId/void")
  @RequiredOrgPermissions({ invoice: ["void"] })
  async voidInvoice(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("invoiceId") invoiceId: string,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = voidInvoiceSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid invoice void payload.",
        issues: parsed.error.issues,
      });
    }

    return this.invoicesPaymentsService.voidInvoice(
      tenant,
      invoiceId,
      parsed.data.reason,
      req.ip,
    );
  }
}
