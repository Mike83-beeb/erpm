import {
  OverheadAllocationType,
  type Prisma,
  ProductionCostCategory,
} from "@scace/db";

export function computeOverheadCents(params: {
  durationMinutes: number;
  laborCostCents: number;
  overheadRateCents: number;
  overheadType: OverheadAllocationType;
  units?: number;
}): number {
  const {
    durationMinutes,
    laborCostCents,
    overheadRateCents,
    overheadType,
    units = 0,
  } = params;

  if (overheadRateCents <= 0) {
    return 0;
  }

  switch (overheadType) {
    case OverheadAllocationType.FIXED_PER_HOUR:
      return Math.round((durationMinutes / 60) * overheadRateCents);
    case OverheadAllocationType.PERCENT_OF_LABOR:
      // overheadRateCents stores percentage points * 100 (basis points / 100 = percent, or e.g. 5000 = 50% when stored in bps, or if rate is integer percent e.g. 25 => 25%? Let's define clearly: overheadRateCents for PERCENT_OF_LABOR is basis points, e.g. 2500 = 25.00%!)
      return Math.round((laborCostCents * overheadRateCents) / 10000);
    case OverheadAllocationType.PER_UNIT:
      return Math.max(0, Math.round(units * overheadRateCents));
  }
}

export function computeTimeLogCosts(params: {
  durationMinutes: number;
  hourlyLaborRateCents: number;
  hourlyMachineRateCents: number;
  overheadRateCents: number;
  overheadType: OverheadAllocationType;
  units?: number;
}) {
  const mins = Math.max(0, params.durationMinutes);
  const laborCostCents = Math.round((mins / 60) * params.hourlyLaborRateCents);
  const machineCostCents = Math.round(
    (mins / 60) * params.hourlyMachineRateCents,
  );
  const overheadCostCents = computeOverheadCents({
    durationMinutes: mins,
    laborCostCents,
    overheadRateCents: params.overheadRateCents,
    overheadType: params.overheadType,
    units: params.units,
  });

  return {
    laborCostCents,
    machineCostCents,
    overheadCostCents,
  };
}

export async function resolveLotUnitCostCents(
  tx: Prisma.TransactionClient,
  organizationId: string,
  stockLotId: string,
): Promise<number> {
  const lot = await tx.stockLot.findFirst({
    where: { id: stockLotId, organizationId },
    select: {
      unitCostCents: true,
      item: { select: { costPriceCents: true } },
      supplierItem: { select: { unitCostCents: true } },
      goodsReceiptLine: {
        select: {
          unitCostCents: true,
          unitsPerPack: true,
        },
      },
    },
  });

  if (!lot) {
    return 0;
  }
  if (lot.unitCostCents > 0) {
    return lot.unitCostCents;
  }
  if (lot.goodsReceiptLine && lot.goodsReceiptLine.unitCostCents > 0) {
    const upp = Math.max(1, lot.goodsReceiptLine.unitsPerPack || 1);
    return Math.round(lot.goodsReceiptLine.unitCostCents / upp);
  }
  if (lot.supplierItem && lot.supplierItem.unitCostCents > 0) {
    return lot.supplierItem.unitCostCents;
  }
  return lot.item.costPriceCents ?? 0;
}

export async function resolveItemStandardUnitCostCents(
  tx: Prisma.TransactionClient,
  organizationId: string,
  itemId: string,
): Promise<number> {
  const item = await tx.item.findFirst({
    where: { id: itemId, organizationId },
    select: {
      costPriceCents: true,
      supplierItems: {
        where: { organizationId, isPreferred: true, isActive: true },
        select: { unitCostCents: true },
        take: 1,
      },
    },
  });
  if (!item) {
    return 0;
  }
  if ((item.costPriceCents ?? 0) > 0) {
    return item.costPriceCents!;
  }
  return item.supplierItems[0]?.unitCostCents ?? 0;
}

export async function recalculateBatchCosting(
  tx: Prisma.TransactionClient,
  organizationId: string,
  batchId: string,
) {
  const batch = await tx.productionBatch.findFirst({
    where: { id: batchId, organizationId },
    include: {
      consumptions: true,
      timeLogs: true,
      costEntries: true,
      reservations: {
        include: {
          item: { select: { id: true, sku: true, name: true, costPriceCents: true } },
        },
      },
      operations: true,
    },
  });

  if (!batch) {
    return null;
  }

  const materialFromConsumptions = batch.consumptions.reduce(
    (sum, c) => sum + c.totalCostCents,
    0,
  );
  const laborFromLogs = batch.timeLogs.reduce(
    (sum, t) => sum + t.laborCostCents,
    0,
  );
  const machineFromLogs = batch.timeLogs.reduce(
    (sum, t) => sum + t.machineCostCents,
    0,
  );
  const overheadFromLogs = batch.timeLogs.reduce(
    (sum, t) => sum + t.overheadCostCents,
    0,
  );

  let manualMaterial = 0;
  let manualLabor = 0;
  let manualMachine = 0;
  let manualOverhead = 0;
  let manualScrap = 0;
  let manualAdjustment = 0;

  for (const entry of batch.costEntries) {
    if (entry.isStandard) continue;
    switch (entry.category) {
      case ProductionCostCategory.MATERIAL:
        manualMaterial += entry.totalCostCents;
        break;
      case ProductionCostCategory.LABOR:
        manualLabor += entry.totalCostCents;
        break;
      case ProductionCostCategory.MACHINE:
        manualMachine += entry.totalCostCents;
        break;
      case ProductionCostCategory.OVERHEAD:
        manualOverhead += entry.totalCostCents;
        break;
      case ProductionCostCategory.SCRAP:
        manualScrap += entry.totalCostCents;
        break;
      case ProductionCostCategory.ADJUSTMENT:
        manualAdjustment += entry.totalCostCents;
        break;
    }
  }

  const actualMaterialCostCents = materialFromConsumptions + manualMaterial;
  const actualLaborCostCents = laborFromLogs + manualLabor;
  const actualMachineCostCents = machineFromLogs + manualMachine;
  const actualOverheadCostCents =
    overheadFromLogs + manualOverhead + manualAdjustment;

  const totalUnitsProducedOrScrapped = batch.actualOutputQty + batch.scrapQty;
  const grossActualConversionAndMaterial =
    actualMaterialCostCents +
    actualLaborCostCents +
    actualMachineCostCents +
    actualOverheadCostCents;

  // Proportional scrap cost if scrapQty > 0 and no explicit SCRAP entries cover it
  const estimatedScrapCostCents =
    batch.scrapQty > 0 && totalUnitsProducedOrScrapped > 0
      ? Math.round(
          (grossActualConversionAndMaterial * batch.scrapQty) /
            totalUnitsProducedOrScrapped,
        )
      : 0;

  const actualScrapCostCents =
    manualScrap > 0 ? manualScrap : estimatedScrapCostCents;
  const actualTotalCostCents = grossActualConversionAndMaterial + manualScrap;
  const costVarianceCents = actualTotalCostCents - batch.standardTotalCostCents;

  await tx.productionBatch.update({
    where: { id: batch.id },
    data: {
      actualMaterialCostCents,
      actualLaborCostCents,
      actualMachineCostCents,
      actualOverheadCostCents,
      actualScrapCostCents,
      actualTotalCostCents,
      costVarianceCents,
    },
  });

  const actualUnitCostCents =
    batch.actualOutputQty > 0
      ? Math.round(actualTotalCostCents / batch.actualOutputQty)
      : 0;

  if (batch.outputLotId && actualUnitCostCents > 0) {
    await tx.stockLot.update({
      where: { id: batch.outputLotId },
      data: { unitCostCents: actualUnitCostCents },
    });
  }

  // Variance Decomposition
  // Material Price vs Usage Variance across reservations
  let materialPriceVarianceCents = 0;
  let materialUsageVarianceCents = 0;
  const consumedByItem = new Map<
    string,
    { qty: number; costCents: number }
  >();
  for (const c of batch.consumptions) {
    const prev = consumedByItem.get(c.itemId) ?? { qty: 0, costCents: 0 };
    prev.qty += c.consumedBaseQty;
    prev.costCents += c.totalCostCents;
    consumedByItem.set(c.itemId, prev);
  }

  const accountedItems = new Set<string>();
  for (const res of batch.reservations) {
    accountedItems.add(res.itemId);
    const stdUnitCost = res.item.costPriceCents ?? 0;
    const actual = consumedByItem.get(res.itemId) ?? { qty: 0, costCents: 0 };
    const actualUnitCost =
      actual.qty > 0 ? actual.costCents / actual.qty : stdUnitCost;
    materialPriceVarianceCents += Math.round(
      (actualUnitCost - stdUnitCost) * actual.qty,
    );
    materialUsageVarianceCents += Math.round(
      (actual.qty - res.requiredBaseQty) * stdUnitCost,
    );
  }

  for (const [itemId, actual] of consumedByItem.entries()) {
    if (!accountedItems.has(itemId)) {
      materialUsageVarianceCents += actual.costCents;
    }
  }

  const laborVarianceCents = actualLaborCostCents - batch.standardLaborCostCents;
  const plannedMinutes = batch.operations.reduce(
    (sum, o) => sum + o.plannedSetupMinutes + o.plannedRunMinutes,
    0,
  );
  const actualMinutes = batch.operations.reduce(
    (sum, o) => sum + o.actualSetupMinutes + o.actualRunMinutes,
    0,
  );
  const avgStdLaborRatePerMin =
    plannedMinutes > 0 ? batch.standardLaborCostCents / plannedMinutes : 0;
  const laborEfficiencyVarianceCents = Math.round(
    (actualMinutes - plannedMinutes) * avgStdLaborRatePerMin,
  );
  const laborRateVarianceCents =
    laborVarianceCents - laborEfficiencyVarianceCents;

  const machineVarianceCents =
    actualMachineCostCents - batch.standardMachineCostCents;
  const overheadVarianceCents =
    actualOverheadCostCents - batch.standardOverheadCostCents;

  return {
    productionBatchId: batch.id,
    batchNumber: batch.batchNumber,
    plannedOutputQty: batch.plannedOutputQty,
    actualOutputQty: batch.actualOutputQty,
    scrapQty: batch.scrapQty,
    standard: {
      materialCostCents: batch.standardMaterialCostCents,
      laborCostCents: batch.standardLaborCostCents,
      machineCostCents: batch.standardMachineCostCents,
      overheadCostCents: batch.standardOverheadCostCents,
      totalCostCents: batch.standardTotalCostCents,
      unitCostCents:
        batch.plannedOutputQty > 0
          ? Math.round(batch.standardTotalCostCents / batch.plannedOutputQty)
          : 0,
    },
    actual: {
      materialCostCents: actualMaterialCostCents,
      laborCostCents: actualLaborCostCents,
      machineCostCents: actualMachineCostCents,
      overheadCostCents: actualOverheadCostCents,
      scrapCostCents: actualScrapCostCents,
      totalCostCents: actualTotalCostCents,
      unitCostCents: actualUnitCostCents,
    },
    variance: {
      materialVarianceCents:
        actualMaterialCostCents - batch.standardMaterialCostCents,
      materialPriceVarianceCents,
      materialUsageVarianceCents,
      laborVarianceCents,
      laborRateVarianceCents,
      laborEfficiencyVarianceCents,
      machineVarianceCents,
      overheadVarianceCents,
      scrapVarianceCents: actualScrapCostCents,
      totalVarianceCents: costVarianceCents,
    },
    timeSummary: {
      plannedMinutes,
      actualMinutes,
    },
  };
}
