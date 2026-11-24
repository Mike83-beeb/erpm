import { BadRequestException } from "@nestjs/common";

export interface BulkQuantityInput {
  packQty?: number;
  looseBaseQty?: number;
  baseQty?: number;
}

export interface NormalizedBulkQuantity {
  unitsPerPack: number;
  packQty: number;
  looseBaseQty: number;
  totalBaseQty: number;
  packEquivalentCeil: number;
  formattedSummary: string;
}

export function normalizeBulkQuantity(
  input: BulkQuantityInput,
  options: {
    unitsPerPack: number;
    packLabel?: string | null;
    baseLabel?: string | null;
    allowZero?: boolean;
    fieldLabel?: string;
  },
): NormalizedBulkQuantity {
  const unitsPerPack = Math.max(1, Math.trunc(options.unitsPerPack || 1));
  const packLabel = (options.packLabel || "pack").trim();
  const baseLabel = (options.baseLabel || "unit").trim();
  const fieldLabel = options.fieldLabel ?? "quantity";

  const hasPackOrLoose =
    input.packQty !== undefined || input.looseBaseQty !== undefined;
  const hasBase = input.baseQty !== undefined;

  if (!hasPackOrLoose && !hasBase) {
    if (options.allowZero) {
      return {
        unitsPerPack,
        packQty: 0,
        looseBaseQty: 0,
        totalBaseQty: 0,
        packEquivalentCeil: 0,
        formattedSummary: `0 ${baseLabel}`,
      };
    }
    throw new BadRequestException(
      `Must provide packQty/looseBaseQty or baseQty for ${fieldLabel}.`,
    );
  }

  let totalBaseQty: number;
  let packQty: number;
  let looseBaseQty: number;

  if (hasPackOrLoose) {
    const rawPack = input.packQty ?? 0;
    const rawLoose = input.looseBaseQty ?? 0;
    if (!Number.isInteger(rawPack) || rawPack < 0) {
      throw new BadRequestException(
        `packQty for ${fieldLabel} must be a non-negative integer.`,
      );
    }
    if (!Number.isInteger(rawLoose) || rawLoose < 0) {
      throw new BadRequestException(
        `looseBaseQty for ${fieldLabel} must be a non-negative integer.`,
      );
    }

    totalBaseQty = rawPack * unitsPerPack + rawLoose;
    if (hasBase) {
      if (!Number.isInteger(input.baseQty) || (input.baseQty ?? 0) < 0) {
        throw new BadRequestException(
          `baseQty for ${fieldLabel} must be a non-negative integer.`,
        );
      }
      if (input.baseQty !== totalBaseQty) {
        throw new BadRequestException(
          `Ambiguous ${fieldLabel}: packQty (${rawPack}) x ${unitsPerPack} + looseBaseQty (${rawLoose}) = ${totalBaseQty}, which does not match baseQty (${input.baseQty}).`,
        );
      }
    }

    // Preserve explicit pack+loose breakdown if loose < unitsPerPack, otherwise normalize cleanly
    if (rawLoose < unitsPerPack) {
      packQty = rawPack;
      looseBaseQty = rawLoose;
    } else {
      packQty = Math.floor(totalBaseQty / unitsPerPack);
      looseBaseQty = totalBaseQty % unitsPerPack;
    }
  } else {
    const rawBase = input.baseQty ?? 0;
    if (!Number.isInteger(rawBase) || rawBase < 0) {
      throw new BadRequestException(
        `baseQty for ${fieldLabel} must be a non-negative integer.`,
      );
    }
    totalBaseQty = rawBase;
    packQty = unitsPerPack > 1 ? Math.floor(totalBaseQty / unitsPerPack) : totalBaseQty;
    looseBaseQty = unitsPerPack > 1 ? totalBaseQty % unitsPerPack : 0;
  }

  if (!options.allowZero && totalBaseQty <= 0) {
    throw new BadRequestException(
      `${fieldLabel} must be greater than 0 base units.`,
    );
  }

  const packEquivalentCeil =
    totalBaseQty === 0 ? 0 : Math.ceil(totalBaseQty / unitsPerPack);

  return {
    unitsPerPack,
    packQty,
    looseBaseQty,
    totalBaseQty,
    packEquivalentCeil,
    formattedSummary: formatBulkUnitSummary(
      totalBaseQty,
      unitsPerPack,
      packLabel,
      baseLabel,
      packQty,
      looseBaseQty,
    ),
  };
}

export function decomposeBaseToBulk(
  baseQty: number,
  unitsPerPack: number,
  packLabel?: string | null,
  baseLabel?: string | null,
): NormalizedBulkQuantity {
  const safeBase = Math.max(0, Math.trunc(baseQty));
  const safeUpp = Math.max(1, Math.trunc(unitsPerPack || 1));
  const packQty = safeUpp > 1 ? Math.floor(safeBase / safeUpp) : safeBase;
  const looseBaseQty = safeUpp > 1 ? safeBase % safeUpp : 0;
  const pLabel = (packLabel || "pack").trim();
  const bLabel = (baseLabel || "unit").trim();

  return {
    unitsPerPack: safeUpp,
    packQty,
    looseBaseQty,
    totalBaseQty: safeBase,
    packEquivalentCeil: safeBase === 0 ? 0 : Math.ceil(safeBase / safeUpp),
    formattedSummary: formatBulkUnitSummary(
      safeBase,
      safeUpp,
      pLabel,
      bLabel,
      packQty,
      looseBaseQty,
    ),
  };
}

export function formatBulkUnitSummary(
  totalBaseQty: number,
  unitsPerPack: number,
  packLabel: string,
  baseLabel: string,
  packQty: number,
  looseBaseQty: number,
): string {
  if (unitsPerPack <= 1) {
    return `${totalBaseQty} ${baseLabel}`;
  }
  const parts: string[] = [];
  if (packQty > 0) {
    parts.push(`${packQty} ${packLabel} (${unitsPerPack}/${packLabel})`);
  }
  if (looseBaseQty > 0 || parts.length === 0) {
    parts.push(`${looseBaseQty} ${baseLabel}`);
  }
  return `${parts.join(" + ")} = ${totalBaseQty} ${baseLabel}`;
}

export function computeBaseUnitValueCents(
  packOrOrderedUnitCostCents: number,
  unitsPerPack: number,
  baseQty: number,
): number {
  if (baseQty <= 0 || packOrOrderedUnitCostCents <= 0) {
    return 0;
  }
  const safeUpp = Math.max(1, Math.trunc(unitsPerPack || 1));
  return Math.round((packOrOrderedUnitCostCents * baseQty) / safeUpp);
}

export function computePoLineCapacity(line: {
  orderedQty: number;
  orderedBaseQty: number;
  unitsPerPack: number;
  acceptedBaseQty: number;
  creditedClaimBaseQty: number;
  quarantinedBaseQty: number;
}, pendingStagedBaseQty: number) {
  const safeUpp = Math.max(1, line.unitsPerPack || 1);
  const effectiveOrderedBaseQty =
    line.orderedBaseQty > 0 ? line.orderedBaseQty : line.orderedQty * safeUpp;
  const committedBaseQty =
    line.acceptedBaseQty +
    line.creditedClaimBaseQty +
    line.quarantinedBaseQty +
    Math.max(0, pendingStagedBaseQty);
  const openBaseQty = Math.max(0, effectiveOrderedBaseQty - committedBaseQty);

  return {
    effectiveOrderedBaseQty,
    committedBaseQty,
    openBaseQty,
  };
}
