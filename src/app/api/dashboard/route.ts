import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [
      totalProperties, totalTaxMasters, enabledTaxMasters, totalNamuna8, totalNamuna9, totalPayments,
      totalWards, totalOwners, totalRoads, totalEmployees,
      totalReceipts, totalPaymentsEntries, totalAssets, totalStock, totalBanks, totalSchemes, totalBudgetHeads, totalFY, totalFloorInfo,
    ] = await Promise.all([
      db.propertyMaster.count(),
      db.taxMaster.count(),
      db.taxMaster.count({ where: { isEnabled: true } }),
      db.namuna8.count(),
      db.namuna9.count(),
      db.payment.count(),
      db.wardMaster.count(),
      db.ownerMaster.count(),
      db.roadMaster.count(),
      db.employeeMaster.count(),
      db.receiptEntry.count(),
      db.paymentEntry.count(),
      db.assetEntry.count(),
      db.stockEntry.count(),
      db.bankAccount.count(),
      db.schemeInfo.count(),
      db.budgetHead.count(),
      db.financialYear.count(),
      db.floorInfo.count(),
    ]);

    const [
      { _sum: demandSum },
      { _sum: paidSum },
      { _sum: receiptSum },
      { _sum: paymentEntrySum },
      { _sum: assetPurchaseSum },
      { _sum: assetCurrentSum },
      { _sum: stockValueSum },
      { _sum: bankBalanceSum },
    ] = await Promise.all([
      db.namuna9.aggregate({ _sum: { totalDemand: true } }),
      db.payment.aggregate({ _sum: { amountPaid: true } }),
      db.receiptEntry.aggregate({ _sum: { amount: true } }),
      db.paymentEntry.aggregate({ _sum: { amount: true } }),
      db.assetEntry.aggregate({ _sum: { purchaseCost: true } }),
      db.assetEntry.aggregate({ _sum: { currentValue: true } }),
      db.stockEntry.aggregate({ _sum: { totalValue: true } }),
      db.bankAccount.aggregate({ _sum: { balance: true } }),
    ]);

    const totalDemand = demandSum.totalDemand || 0;
    const totalPaid = paidSum.amountPaid || 0;

    return NextResponse.json({
      // Original stats
      totalProperties, totalTaxMasters, enabledTaxMasters, totalNamuna8, totalNamuna9, totalPayments,
      totalWards, totalOwners, totalRoads, totalEmployees,
      totalDemand: Math.round(totalDemand * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstandingBalance: Math.round((totalDemand - totalPaid) * 100) / 100,

      // New transaction stats
      totalReceipts,
      totalPayments: totalPaymentsEntries,
      totalAssets,
      totalStock,
      totalBanks,
      totalSchemes,
      totalBudgetHeads,
      totalFY,
      totalFloorInfo,

      // Financial summaries
      totalReceiptAmount: Math.round((receiptSum.amount || 0) * 100) / 100,
      totalPaymentAmount: Math.round((paymentEntrySum.amount || 0) * 100) / 100,
      totalAssetPurchaseValue: Math.round((assetPurchaseSum.purchaseCost || 0) * 100) / 100,
      totalAssetCurrentValue: Math.round((assetCurrentSum.currentValue || 0) * 100) / 100,
      totalStockValue: Math.round((stockValueSum.totalValue || 0) * 100) / 100,
      totalBankBalance: Math.round((bankBalanceSum.balance || 0) * 100) / 100,
      totalDepreciation: Math.round(((assetPurchaseSum.purchaseCost || 0) - (assetCurrentSum.currentValue || 0)) * 100) / 100,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
