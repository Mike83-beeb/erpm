import { DiscountType, PricingModel } from "@scace/db";

export interface PricingTierInput {
  id?: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPriceCents: number | null;
  flatFeeCents: number | null;
  packageSize: number | null;
  packagePriceCents: number | null;
  discountBps: number | null;
  sortOrder: number;
}

export interface AppliedTierBreakdown {
  tierId: string | null;
  minQuantity: number;
  maxQuantity: number | null;
  units: number;
  unitPriceCents: number;
  flatFeeCents: number;
  lineAmountCents: number;
  note?: string;
}

export interface TierCalculationResult {
  subtotalCents: number;
  effectiveUnitPriceCents: number;
  appliedTiers: AppliedTierBreakdown[];
}

export interface PricingConditionContext {
  channel?: string;
  customerSegment?: string;
  externalAccountId?: string;
  lineQuantity: number;
  orderSubtotalCents?: number;
  itemTags: string[];
  itemMetadata?: Record<string, unknown> | null;
  atDate: Date;
  customContext?: Record<string, unknown>;
}

export interface CustomAdjustmentSpec {
  type: "PERCENTAGE_DELTA" | "FIXED_DELTA_CENTS" | "SET_UNIT_PRICE_CENTS";
  bps?: number;
  amountCents?: number;
  unitPriceCents?: number;
}

export function applyDiscountBps(
  baseUnitPriceCents: number,
  discountBps: number | null | undefined,
): number {
  if (!discountBps || discountBps <= 0) {
    return baseUnitPriceCents;
  }
  const clamped = Math.min(discountBps, 10000);
  return Math.max(0, Math.round((baseUnitPriceCents * (10000 - clamped)) / 10000));
}

export function calculateTieredSubtotal(
  pricingModel: PricingModel,
  baseUnitPriceCents: number,
  quantity: number,
  rawTiers: PricingTierInput[],
): TierCalculationResult {
  if (quantity <= 0) {
    return {
      subtotalCents: 0,
      effectiveUnitPriceCents: baseUnitPriceCents,
      appliedTiers: [],
    };
  }

  const tiers = [...rawTiers].sort(
    (a, b) => a.minQuantity - b.minQuantity || a.sortOrder - b.sortOrder,
  );

  if (pricingModel === PricingModel.FLAT || tiers.length === 0) {
    const subtotalCents = quantity * baseUnitPriceCents;
    return {
      subtotalCents,
      effectiveUnitPriceCents: baseUnitPriceCents,
      appliedTiers: [
        {
          tierId: null,
          minQuantity: 1,
          maxQuantity: null,
          units: quantity,
          unitPriceCents: baseUnitPriceCents,
          flatFeeCents: 0,
          lineAmountCents: subtotalCents,
        },
      ],
    };
  }

  if (pricingModel === PricingModel.VOLUME) {
    const matching = tiers
      .filter(
        (t) =>
          t.minQuantity <= quantity &&
          (t.maxQuantity === null || quantity <= t.maxQuantity),
      )
      .sort((a, b) => b.minQuantity - a.minQuantity)[0];

    if (!matching) {
      const subtotalCents = quantity * baseUnitPriceCents;
      return {
        subtotalCents,
        effectiveUnitPriceCents: baseUnitPriceCents,
        appliedTiers: [
          {
            tierId: null,
            minQuantity: 1,
            maxQuantity: null,
            units: quantity,
            unitPriceCents: baseUnitPriceCents,
            flatFeeCents: 0,
            lineAmountCents: subtotalCents,
          },
        ],
      };
    }

    const unitPrice =
      matching.unitPriceCents ??
      applyDiscountBps(baseUnitPriceCents, matching.discountBps);
    const flatFee = matching.flatFeeCents ?? 0;
    const subtotalCents = quantity * unitPrice + flatFee;

    return {
      subtotalCents,
      effectiveUnitPriceCents: Math.round(subtotalCents / quantity),
      appliedTiers: [
        {
          tierId: matching.id ?? null,
          minQuantity: matching.minQuantity,
          maxQuantity: matching.maxQuantity,
          units: quantity,
          unitPriceCents: unitPrice,
          flatFeeCents: flatFee,
          lineAmountCents: subtotalCents,
          note: "volume-break",
        },
      ],
    };
  }

  if (pricingModel === PricingModel.GRADUATED) {
    const appliedTiers: AppliedTierBreakdown[] = [];
    let remaining = quantity;
    let cursor = 1;
    let subtotalCents = 0;

    for (const tier of tiers) {
      if (remaining <= 0) {
        break;
      }

      if (tier.minQuantity > cursor) {
        const gapEnd = tier.minQuantity - 1;
        const gapUnits = Math.min(remaining, gapEnd - cursor + 1);
        if (gapUnits > 0) {
          const gapAmount = gapUnits * baseUnitPriceCents;
          subtotalCents += gapAmount;
          appliedTiers.push({
            tierId: null,
            minQuantity: cursor,
            maxQuantity: gapEnd,
            units: gapUnits,
            unitPriceCents: baseUnitPriceCents,
            flatFeeCents: 0,
            lineAmountCents: gapAmount,
            note: "base-slab",
          });
          remaining -= gapUnits;
          cursor += gapUnits;
        }
      }

      if (remaining <= 0) {
        break;
      }

      const slabMax = tier.maxQuantity ?? Number.MAX_SAFE_INTEGER;
      if (cursor > slabMax) {
        continue;
      }

      const slabCapacity =
        slabMax === Number.MAX_SAFE_INTEGER
          ? remaining
          : slabMax - Math.max(cursor, tier.minQuantity) + 1;
      const slabUnits = Math.min(remaining, Math.max(0, slabCapacity));

      if (slabUnits > 0) {
        const unitPrice =
          tier.unitPriceCents ??
          applyDiscountBps(baseUnitPriceCents, tier.discountBps);
        const flatFee = tier.flatFeeCents ?? 0;
        const slabAmount = slabUnits * unitPrice + flatFee;
        subtotalCents += slabAmount;
        appliedTiers.push({
          tierId: tier.id ?? null,
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          units: slabUnits,
          unitPriceCents: unitPrice,
          flatFeeCents: flatFee,
          lineAmountCents: slabAmount,
          note: "graduated-slab",
        });
        remaining -= slabUnits;
        cursor += slabUnits;
      }
    }

    if (remaining > 0) {
      const tailAmount = remaining * baseUnitPriceCents;
      subtotalCents += tailAmount;
      appliedTiers.push({
        tierId: null,
        minQuantity: cursor,
        maxQuantity: null,
        units: remaining,
        unitPriceCents: baseUnitPriceCents,
        flatFeeCents: 0,
        lineAmountCents: tailAmount,
        note: "overflow-base-slab",
      });
    }

    return {
      subtotalCents,
      effectiveUnitPriceCents: Math.round(subtotalCents / quantity),
      appliedTiers,
    };
  }

  // PACKAGE model: blocks of packageSize at packagePriceCents + optional remainder
  const pkgTier = tiers
    .filter(
      (t) =>
        t.minQuantity <= quantity &&
        (t.maxQuantity === null || quantity <= t.maxQuantity) &&
        t.packageSize !== null &&
        t.packageSize > 0 &&
        t.packagePriceCents !== null,
    )
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];

  if (!pkgTier || !pkgTier.packageSize || pkgTier.packagePriceCents === null) {
    const subtotalCents = quantity * baseUnitPriceCents;
    return {
      subtotalCents,
      effectiveUnitPriceCents: baseUnitPriceCents,
      appliedTiers: [
        {
          tierId: null,
          minQuantity: 1,
          maxQuantity: null,
          units: quantity,
          unitPriceCents: baseUnitPriceCents,
          flatFeeCents: 0,
          lineAmountCents: subtotalCents,
        },
      ],
    };
  }

  const fullPackages = Math.floor(quantity / pkgTier.packageSize);
  const remainder = quantity % pkgTier.packageSize;
  const remainderUnitPrice =
    pkgTier.unitPriceCents ??
    applyDiscountBps(baseUnitPriceCents, pkgTier.discountBps);
  const flatFee = pkgTier.flatFeeCents ?? 0;

  const pkgAmount = fullPackages * pkgTier.packagePriceCents + flatFee;
  const remainderAmount = remainder * remainderUnitPrice;
  const subtotalCents = pkgAmount + remainderAmount;

  const appliedTiers: AppliedTierBreakdown[] = [];
  if (fullPackages > 0) {
    appliedTiers.push({
      tierId: pkgTier.id ?? null,
      minQuantity: pkgTier.minQuantity,
      maxQuantity: pkgTier.maxQuantity,
      units: fullPackages * pkgTier.packageSize,
      unitPriceCents: Math.round(pkgTier.packagePriceCents / pkgTier.packageSize),
      flatFeeCents: flatFee,
      lineAmountCents: pkgAmount,
      note: `package-${pkgTier.packageSize}x${fullPackages}`,
    });
  }
  if (remainder > 0) {
    appliedTiers.push({
      tierId: pkgTier.id ?? null,
      minQuantity: pkgTier.minQuantity,
      maxQuantity: pkgTier.maxQuantity,
      units: remainder,
      unitPriceCents: remainderUnitPrice,
      flatFeeCents: 0,
      lineAmountCents: remainderAmount,
      note: "package-remainder",
    });
  }

  return {
    subtotalCents,
    effectiveUnitPriceCents: Math.round(subtotalCents / quantity),
    appliedTiers,
  };
}

export function evaluatePricingConditions(
  conditionsJson: unknown,
  ctx: PricingConditionContext,
): boolean {
  if (!conditionsJson || typeof conditionsJson !== "object") {
    return true;
  }
  const cond = conditionsJson as Record<string, unknown>;

  if (Array.isArray(cond.channels) && cond.channels.length > 0) {
    if (!ctx.channel || !cond.channels.includes(ctx.channel)) {
      return false;
    }
  }

  if (Array.isArray(cond.customerSegments) && cond.customerSegments.length > 0) {
    if (
      !ctx.customerSegment ||
      !cond.customerSegments.includes(ctx.customerSegment)
    ) {
      return false;
    }
  }

  if (
    Array.isArray(cond.externalAccountIds) &&
    cond.externalAccountIds.length > 0
  ) {
    if (
      !ctx.externalAccountId ||
      !cond.externalAccountIds.includes(ctx.externalAccountId)
    ) {
      return false;
    }
  }

  if (typeof cond.minLineQty === "number" && ctx.lineQuantity < cond.minLineQty) {
    return false;
  }

  if (typeof cond.maxLineQty === "number" && ctx.lineQuantity > cond.maxLineQty) {
    return false;
  }

  if (
    typeof cond.minOrderSubtotalCents === "number" &&
    (ctx.orderSubtotalCents ?? 0) < cond.minOrderSubtotalCents
  ) {
    return false;
  }

  if (Array.isArray(cond.requiredTags) && cond.requiredTags.length > 0) {
    const hasMatch = cond.requiredTags.some(
      (tag) => typeof tag === "string" && ctx.itemTags.includes(tag),
    );
    if (!hasMatch) {
      return false;
    }
  }

  if (Array.isArray(cond.daysOfWeek) && cond.daysOfWeek.length > 0) {
    const day = ctx.atDate.getUTCDay();
    if (!cond.daysOfWeek.includes(day)) {
      return false;
    }
  }

  if (cond.metadataEquals && typeof cond.metadataEquals === "object") {
    const meta = ctx.itemMetadata ?? {};
    for (const [key, expected] of Object.entries(
      cond.metadataEquals as Record<string, unknown>,
    )) {
      if (meta[key] !== expected) {
        return false;
      }
    }
  }

  if (cond.contextEquals && typeof cond.contextEquals === "object") {
    const custom = ctx.customContext ?? {};
    for (const [key, expected] of Object.entries(
      cond.contextEquals as Record<string, unknown>,
    )) {
      if (custom[key] !== expected) {
        return false;
      }
    }
  }

  return true;
}

export function applyCustomRuleAdjustment(
  subtotalCents: number,
  quantity: number,
  adjustmentJson: unknown,
): { subtotalCents: number; adjustmentCents: number } {
  if (!adjustmentJson || typeof adjustmentJson !== "object" || quantity <= 0) {
    return { subtotalCents, adjustmentCents: 0 };
  }

  const adj = adjustmentJson as Partial<CustomAdjustmentSpec>;
  if (adj.type === "PERCENTAGE_DELTA" && typeof adj.bps === "number") {
    const delta = Math.round((subtotalCents * adj.bps) / 10000);
    const next = Math.max(0, subtotalCents + delta);
    return { subtotalCents: next, adjustmentCents: next - subtotalCents };
  }

  if (adj.type === "FIXED_DELTA_CENTS" && typeof adj.amountCents === "number") {
    const next = Math.max(0, subtotalCents + adj.amountCents);
    return { subtotalCents: next, adjustmentCents: next - subtotalCents };
  }

  if (
    adj.type === "SET_UNIT_PRICE_CENTS" &&
    typeof adj.unitPriceCents === "number" &&
    adj.unitPriceCents >= 0
  ) {
    const next = quantity * adj.unitPriceCents;
    return { subtotalCents: next, adjustmentCents: next - subtotalCents };
  }

  return { subtotalCents, adjustmentCents: 0 };
}

export function enforceMinMarginFloor(
  subtotalCents: number,
  quantity: number,
  costPriceCents: number,
  minMarginBps: number | null | undefined,
): { subtotalCents: number; marginFloorApplied: boolean } {
  if (
    minMarginBps === null ||
    minMarginBps === undefined ||
    minMarginBps <= 0 ||
    minMarginBps >= 10000 ||
    costPriceCents <= 0 ||
    quantity <= 0
  ) {
    return { subtotalCents, marginFloorApplied: false };
  }

  const totalCostCents = quantity * costPriceCents;
  const minAllowedSubtotal = Math.ceil(
    (totalCostCents * 10000) / (10000 - minMarginBps),
  );

  if (subtotalCents < minAllowedSubtotal) {
    return { subtotalCents: minAllowedSubtotal, marginFloorApplied: true };
  }

  return { subtotalCents, marginFloorApplied: false };
}

export interface DiscountCalculationInput {
  discountType: DiscountType;
  valueBps: number | null;
  amountCents: number | null;
  fixedPriceCents: number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  getDiscountBps: number | null;
  maxDiscountCents: number | null;
}

export function calculateDiscountAmount(
  rule: DiscountCalculationInput,
  subtotalCents: number,
  quantity: number,
  unitPriceCents: number,
): { discountCents: number; bonusUnits: number } {
  if (subtotalCents <= 0 || quantity <= 0) {
    return { discountCents: 0, bonusUnits: 0 };
  }

  let discountCents = 0;
  let bonusUnits = 0;

  switch (rule.discountType) {
    case DiscountType.PERCENTAGE: {
      const bps = Math.max(0, Math.min(10000, rule.valueBps ?? 0));
      discountCents = Math.round((subtotalCents * bps) / 10000);
      break;
    }
    case DiscountType.FIXED_AMOUNT: {
      discountCents = Math.max(0, rule.amountCents ?? 0);
      break;
    }
    case DiscountType.FIXED_PRICE: {
      const target = Math.max(0, rule.fixedPriceCents ?? unitPriceCents);
      discountCents = Math.max(0, subtotalCents - quantity * target);
      break;
    }
    case DiscountType.BUY_X_GET_Y: {
      const buyQty = rule.buyQuantity ?? 0;
      const getQty = rule.getQuantity ?? 0;
      if (buyQty >= 1 && getQty >= 1) {
        const groupSize = buyQty + getQty;
        const sets = Math.floor(quantity / groupSize);
        bonusUnits = sets * getQty;
        const pctOffBps = Math.max(
          0,
          Math.min(10000, rule.getDiscountBps ?? 10000),
        );
        discountCents = Math.round(
          (bonusUnits * unitPriceCents * pctOffBps) / 10000,
        );
      }
      break;
    }
  }

  if (rule.maxDiscountCents !== null && rule.maxDiscountCents >= 0) {
    discountCents = Math.min(discountCents, rule.maxDiscountCents);
  }

  discountCents = Math.min(subtotalCents, Math.max(0, discountCents));
  return { discountCents, bonusUnits };
}
