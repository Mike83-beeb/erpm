import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { PurchaseOrderStatus } from "@erp/db";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import {
  CurrentTenant,
  RequireActiveTenant,
  RequiredOrgPermissions,
  type AuthenticatedTenant,
} from "../tenancy/tenant.decorators.js";
import { PurchaseOrdersService } from "./purchase-orders.service.js";

const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((v) => v.toUpperCase());

const poLineSchema = z.object({
  itemId: z.string().trim().min(1),
  orderedQty: z.number().int().min(1).max(1_000_000),
  unitCostCents: z.number().int().min(0).max(2_000_000_000).optional(),
  supplierSku: z.string().trim().max(64).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

const createPurchaseOrderSchema = z.object({
  poNumber: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/)
    .optional(),
  supplierId: z.string().trim().min(1),
  locationId: z.string().trim().min(1),
  currency: currencySchema.optional(),
  taxCents: z.number().int().min(0).max(2_000_000_000).optional(),
  expectedAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  lines: z.array(poLineSchema).min(1).max(200),
});

const updateDraftPoSchema = z.object({
  locationId: z.string().trim().min(1).optional(),
  currency: currencySchema.optional(),
  taxCents: z.number().int().min(0).max(2_000_000_000).optional(),
  expectedAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  lines: z.array(poLineSchema).min(1).max(200).optional(),
});

const listPoQuerySchema = z.object({
  status: z
    .enum([
      PurchaseOrderStatus.DRAFT,
      PurchaseOrderStatus.SUBMITTED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
      PurchaseOrderStatus.RECEIVED,
      PurchaseOrderStatus.CANCELLED,
    ])
    .optional(),
  supplierId: z.string().trim().min(1).optional(),
  locationId: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
});

const cancelPoSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

const receiveGoodsSchema = z.object({
  receiptNumber: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/)
    .optional(),
  locationId: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(1000).optional(),
  lines: z
    .array(
      z.object({
        purchaseOrderLineId: z.string().trim().min(1),
        receivedQty: z.number().int().min(1).max(1_000_000),
      }),
    )
    .min(1)
    .max(200),
});

@Controller("api/v1/purchase-orders")
@RequireActiveTenant()
export class PurchaseOrdersController {
  constructor(
    @Inject(PurchaseOrdersService)
    private readonly purchaseOrdersService: PurchaseOrdersService,
  ) {}

  @Post()
  @RequiredOrgPermissions({ purchaseOrder: ["create"] })
  async createPurchaseOrder(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = createPurchaseOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid purchase order payload.",
        issues: parsed.error.issues,
      });
    }

    return this.purchaseOrdersService.createPurchaseOrder(
      tenant,
      parsed.data,
      req.ip,
    );
  }

  @Get()
  @RequiredOrgPermissions({ purchaseOrder: ["read"] })
  async listPurchaseOrders(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Query() query: unknown,
  ) {
    const parsed = listPoQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid purchase order query parameters.",
        issues: parsed.error.issues,
      });
    }

    return this.purchaseOrdersService.listPurchaseOrders(tenant, parsed.data);
  }

  @Get(":poId")
  @RequiredOrgPermissions({ purchaseOrder: ["read"] })
  async getPurchaseOrder(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("poId") poId: string,
  ) {
    return this.purchaseOrdersService.getPurchaseOrder(tenant, poId);
  }

  @Patch(":poId")
  @RequiredOrgPermissions({ purchaseOrder: ["update"] })
  async updateDraftPurchaseOrder(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("poId") poId: string,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = updateDraftPoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid purchase order update payload.",
        issues: parsed.error.issues,
      });
    }

    return this.purchaseOrdersService.updateDraftPurchaseOrder(
      tenant,
      poId,
      parsed.data,
      req.ip,
    );
  }

  @Post(":poId/submit")
  @RequiredOrgPermissions({ purchaseOrder: ["submit"] })
  async submitPurchaseOrder(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("poId") poId: string,
    @Req() req: FastifyRequest,
  ) {
    return this.purchaseOrdersService.submitPurchaseOrder(tenant, poId, req.ip);
  }

  @Post(":poId/cancel")
  @RequiredOrgPermissions({ purchaseOrder: ["cancel"] })
  async cancelPurchaseOrder(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("poId") poId: string,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = cancelPoSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid cancellation payload.",
        issues: parsed.error.issues,
      });
    }

    return this.purchaseOrdersService.cancelPurchaseOrder(
      tenant,
      poId,
      parsed.data.reason,
      req.ip,
    );
  }

  @Post(":poId/receive")
  @RequiredOrgPermissions({ purchaseOrder: ["receive"] })
  async receiveGoods(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("poId") poId: string,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = receiveGoodsSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid goods receipt payload.",
        issues: parsed.error.issues,
      });
    }

    return this.purchaseOrdersService.receiveGoods(
      tenant,
      poId,
      parsed.data,
      req.ip,
    );
  }
}
