import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Core counts
    const [
      totalProperties,
      totalTaxMasters,
      enabledTaxMasters,
      totalNamuna8,
      totalNamuna9,
      totalPayments,
      totalWards,
      totalOwners,
      totalRoads,
      totalEmployees,
      totalReceiptEntries,
      totalPaymentEntries,
      totalJournalEntries,
      unpostedReceipts,
      unpostedPayments,
      unpostedJournals,
      totalAssetEntries,
      totalStockEntries,
      totalCollectionEntries,
      totalWaterBills,
      totalSchemeFunds,
      totalBankAccounts,
      totalBudgetHeads,
      totalSchemes,
      totalDrainage,
      totalWaterSupply,
      totalStreetLights,
      totalReadyReckoner,
      totalDisability,
      totalFloorInfo,
      totalDemandCategories,
      totalBudgetEntries,
      totalWorkEntries,
      totalSalaryEntries,
      totalContractors,
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
      db.journalEntry.count(),
      db.receiptEntry.count({ where: { isPosted: false } }),
      db.paymentEntry.count({ where: { isPosted: false } }),
      db.journalEntry.count({ where: { isPosted: false } }),
      db.assetEntry.count(),
      db.stockEntry.count(),
      db.collectionEntry.count(),
      db.waterBillEntry.count(),
      db.schemeFundEntry.count(),
      db.bankAccount.count(),
      db.budgetHead.count(),
      db.schemeInfo.count(),
      db.drainageMaster.count(),
      db.waterSupplyMaster.count(),
      db.streetLightMaster.count(),
      db.readyReckonerMaster.count(),
      db.disabilityMaster.count(),
      db.floorInfo.count(),
      db.demandCategory.count(),
      db.budgetEntry.count(),
      db.workEntry.count(),
      db.salaryEntry.count(),
      db.contractorMaster.count(),
    ]);

    // Financial aggregates
    const [
      { _sum: demandSum },
      { _sum: paidSum },
      { _sum: receiptSum },
      { _sum: paymentSum },
    ] = await Promise.all([
      db.namuna9.aggregate({ _sum: { totalDemand: true } }),
      db.payment.aggregate({ _sum: { amountPaid: true } }),
      db.receiptEntry.aggregate({ _sum: { amount: true } }),
      db.paymentEntry.aggregate({ _sum: { amount: true } }),
    ]);

    const totalDemand = demandSum.totalDemand || 0;
    const totalPaid = paidSum.amountPaid || 0;
    const totalIncome = (receiptSum.amount || 0) + totalPaid;
    const totalExpenditure = paymentSum.amount || 0;

    // Recent transactions
    const recentReceipts = await db.receiptEntry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        voucherNumber: true,
        receiptDate: true,
        receivedFrom: true,
        receivedFromMr: true,
        amount: true,
        paymentMethod: true,
        isPosted: true,
        createdAt: true,
      },
    });

    const recentPayments = await db.paymentEntry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        voucherNumber: true,
        paymentDate: true,
        paidTo: true,
        paidToMr: true,
        amount: true,
        paymentMethod: true,
        isPosted: true,
        createdAt: true,
      },
    });

    // Namuna status tracker
    const namunaStatus: { number: number; name: string; nameMr: string; status: 'available' | 'partial' | 'none'; viewId: string }[] = [
      { number: 1, name: 'Property Registration', nameMr: 'मालमत्ता नोंदणी पत्र', status: totalNamuna8 > 0 ? 'available' : totalProperties > 0 ? 'partial' : 'none', viewId: 'namuna-1' },
      { number: 2, name: 'Property Valuation', nameMr: 'मालमत्ता मूल्यांकन', status: totalProperties > 0 ? 'partial' : 'none', viewId: 'namuna-2' },
      { number: 3, name: 'Cash Book', nameMr: 'रोकड वही', status: totalReceiptEntries > 0 || totalPaymentEntries > 0 ? 'partial' : 'none', viewId: 'namuna-3' },
      { number: 4, name: 'Bank Book', nameMr: 'बँक वही', status: totalBankAccounts > 0 ? 'partial' : 'none', viewId: 'namuna-4' },
      { number: 5, name: 'Asset Register', nameMr: 'मालमत्ता रजिस्टर', status: totalAssetEntries > 0 ? 'available' : 'none', viewId: 'namuna-5' },
      { number: 6, name: 'Stock Register', nameMr: 'साठा रजिस्टर', status: totalStockEntries > 0 ? 'available' : 'none', viewId: 'namuna-6' },
      { number: 7, name: 'Grant Register', nameMr: 'अनुदान नोंदवही', status: totalSchemeFunds > 0 ? 'partial' : 'none', viewId: 'namuna-7' },
      { number: 8, name: 'Tax Assessment', nameMr: 'कर आकारणी नोंदवही', status: totalNamuna8 > 0 ? 'available' : 'partial', viewId: 'namuna-8' },
      { number: 9, name: 'Demand Register', nameMr: 'मागणी नोंदवही', status: totalNamuna9 > 0 ? 'available' : 'partial', viewId: 'namuna-9' },
      { number: 10, name: 'Grant Register 10', nameMr: 'अनुदान रजिस्टर', status: totalSchemeFunds > 0 ? 'partial' : 'none', viewId: 'namuna-10' },
      { number: 11, name: 'Financial Report I', nameMr: 'वित्तीय अहवाल I', status: 'none', viewId: 'namuna-11-15' },
      { number: 12, name: 'Financial Report II', nameMr: 'वित्तीय अहवाल II', status: 'none', viewId: 'namuna-11-15' },
      { number: 13, name: 'Financial Report III', nameMr: 'वित्तीय अहवाल III', status: 'none', viewId: 'namuna-11-15' },
      { number: 14, name: 'Financial Report IV', nameMr: 'वित्तीय अहवाल IV', status: 'none', viewId: 'namuna-11-15' },
      { number: 15, name: 'Financial Report V', nameMr: 'वित्तीय अहवाल V', status: 'none', viewId: 'namuna-11-15' },
      { number: 16, name: 'Asset Report I', nameMr: 'मालमत्ता अहवाल I', status: totalAssetEntries > 0 ? 'partial' : 'none', viewId: 'namuna-16-18' },
      { number: 17, name: 'Asset Report II', nameMr: 'मालमत्ता अहवाल II', status: totalAssetEntries > 0 ? 'partial' : 'none', viewId: 'namuna-16-18' },
      { number: 18, name: 'Asset Report III', nameMr: 'मालमत्ता अहवाल III', status: totalAssetEntries > 0 ? 'partial' : 'none', viewId: 'namuna-16-18' },
      { number: 19, name: 'Tax Collection Book', nameMr: 'कर वसूल वही', status: totalCollectionEntries > 0 ? 'available' : 'partial', viewId: 'namuna-19' },
      { number: 20, name: 'Collection Report', nameMr: 'वसूल अहवाल', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-21-24' },
      { number: 21, name: 'Collection Report I', nameMr: 'वसूल अहवाल I', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-21-24' },
      { number: 22, name: 'Collection Report II', nameMr: 'वसूल अहवाल II', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-21-24' },
      { number: 23, name: 'Collection Report III', nameMr: 'वसूल अहवाल III', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-21-24' },
      { number: 24, name: 'Collection Report IV', nameMr: 'वसूल अहवाल IV', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-21-24' },
      { number: 25, name: 'Audit Report I', nameMr: 'हिशेब तपासणी I', status: 'none', viewId: 'namuna-25-27' },
      { number: 26, name: 'Audit Report II', nameMr: 'हिशेब तपासणी II', status: 'none', viewId: 'namuna-25-27' },
      { number: 27, name: 'Audit Report III', nameMr: 'हिशेब तपासणी III', status: 'none', viewId: 'namuna-25-27' },
      { number: 28, name: 'Scheme Report I', nameMr: 'योजना अहवाल I', status: totalSchemes > 0 ? 'partial' : 'none', viewId: 'namuna-28-30' },
      { number: 29, name: 'Scheme Report II', nameMr: 'योजना अहवाल II', status: totalSchemes > 0 ? 'partial' : 'none', viewId: 'namuna-28-30' },
      { number: 30, name: 'Scheme Report III', nameMr: 'योजना अहवाल III', status: totalSchemes > 0 ? 'partial' : 'none', viewId: 'namuna-28-30' },
      { number: 31, name: 'Final Account I', nameMr: 'अंतिम हिशेब I', status: 'none', viewId: 'namuna-31-33' },
      { number: 32, name: 'Final Account II', nameMr: 'अंतिम हिशेब II', status: 'none', viewId: 'namuna-31-33' },
      { number: 33, name: 'Final Account III', nameMr: 'अंतिम हिशेब III', status: 'none', viewId: 'namuna-31-33' },
    ];

    return NextResponse.json({
      totalProperties, totalTaxMasters, enabledTaxMasters, totalNamuna8, totalNamuna9, totalPayments,
      totalWards, totalOwners, totalRoads, totalEmployees,
      totalDemand: Math.round(totalDemand * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstandingBalance: Math.round((totalDemand - totalPaid) * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenditure: Math.round(totalExpenditure * 100) / 100,
      balance: Math.round((totalIncome - totalExpenditure) * 100) / 100,
      totalReceiptEntries, totalPaymentEntries, totalJournalEntries,
      pendingEntries: unpostedReceipts + unpostedPayments + unpostedJournals,
      unpostedReceipts, unpostedPayments, unpostedJournals,
      totalAssetEntries, totalStockEntries, totalCollectionEntries,
      totalWaterBills, totalSchemeFunds,
      totalBankAccounts, totalBudgetHeads, totalSchemes,
      totalDrainage, totalWaterSupply, totalStreetLights,
      totalReadyReckoner, totalDisability, totalFloorInfo, totalDemandCategories,
      totalBudgetEntries, totalWorkEntries, totalSalaryEntries, totalContractors,
      recentReceipts, recentPayments, namunaStatus,
      totalReceiptsPayments: totalReceiptEntries + totalPaymentEntries,
    });
  } catch (error) {
    console.error('Enhanced dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
