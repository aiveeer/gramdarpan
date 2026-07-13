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
      { number: 1, name: 'Budget Estimate', nameMr: 'अर्थसंकल्प/अंदाजपत्रक', status: totalNamuna8 > 0 ? 'available' : totalProperties > 0 ? 'partial' : 'none', viewId: 'namuna-1' },
      { number: 2, name: 'Re-appropriation & Revised Budget', nameMr: 'पुनर्विनियोजन व नियत वाटप (सुधारित अर्थसंकल्प)', status: totalProperties > 0 ? 'partial' : 'none', viewId: 'namuna-2' },
      { number: 3, name: 'Income & Expenditure Statement', nameMr: 'ग्रामपंचायत जमा-खर्च विवरण', status: totalReceiptEntries > 0 || totalPaymentEntries > 0 ? 'partial' : 'none', viewId: 'namuna-3' },
      { number: 4, name: 'Assets & Liabilities', nameMr: 'ग्रामपंचायतीची मत्ता व दायित्वे', status: totalBankAccounts > 0 ? 'partial' : 'none', viewId: 'namuna-4' },
      { number: 5, name: 'General Cash Book', nameMr: 'सामान्य रोकड वही', status: totalAssetEntries > 0 ? 'available' : 'none', viewId: 'namuna-5' },
      { number: 6, name: 'Classified Receipt Register', nameMr: 'वर्गीकृत नोंदवही', status: totalStockEntries > 0 ? 'available' : 'none', viewId: 'namuna-6' },
      { number: 7, name: 'General Receipt', nameMr: 'सामान्य पावती', status: totalSchemeFunds > 0 ? 'partial' : 'none', viewId: 'namuna-7' },
      { number: 8, name: 'Tax Assessment Register', nameMr: 'कर आकारणी नोंदवही', status: totalNamuna8 > 0 ? 'available' : 'partial', viewId: 'namuna-8' },
      { number: 9, name: 'Tax Demand Register', nameMr: 'कर मागणी नोंदवही', status: totalNamuna9 > 0 ? 'available' : 'partial', viewId: 'namuna-9' },
      { number: 10, name: 'Tax & Fee Receipt', nameMr: 'कर व फी बाबत पावती', status: totalSchemeFunds > 0 ? 'partial' : 'none', viewId: 'namuna-10' },
      { number: 11, name: 'Miscellaneous Tax & Fee Assessment', nameMr: 'किरकोळ कर व फी आकारणी नोंदवही', status: 'none', viewId: 'namuna-11' },
      { number: 12, name: 'Contingent Expense Voucher', nameMr: 'अकस्मात खर्चाचे प्रमाणक', status: 'none', viewId: 'namuna-12' },
      { number: 13, name: 'Employee Register', nameMr: 'कर्मचारी नोंदवही', status: 'none', viewId: 'namuna-13' },
      { number: 14, name: 'Stamp Account Register', nameMr: 'मुद्रांक हिशोब नोंदवही', status: 'none', viewId: 'namuna-14' },
      { number: 15, name: 'Consumable Stock Register', nameMr: 'उपभोग्य वस्तू साठा नोंदवही', status: 'none', viewId: 'namuna-15' },
      { number: 16, name: 'Dead Stock & Movable Property', nameMr: 'जडवस्तू संग्रह व जंगम मालमत्ता नोंदवही', status: totalAssetEntries > 0 ? 'partial' : 'none', viewId: 'namuna-16' },
      { number: 17, name: 'Advance & Deposit Register', nameMr: 'अग्रीम/अनामत रक्कम नोंदवही', status: totalAssetEntries > 0 ? 'partial' : 'none', viewId: 'namuna-17' },
      { number: 18, name: 'Petty Cash Book', nameMr: 'किरकोळ रोकडवही', status: totalAssetEntries > 0 ? 'partial' : 'none', viewId: 'namuna-18' },
      { number: 19, name: 'Muster Roll / Attendance', nameMr: 'हजेरीपट (मजुरांची हजेरी)', status: totalCollectionEntries > 0 ? 'available' : 'partial', viewId: 'namuna-19' },
      { number: 20, name: 'Estimate Register for Works', nameMr: 'कामाच्या अंदाजाची नोंदवही', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-20' },
      { number: 21, name: 'Employee Bill Register', nameMr: 'कर्मचाऱ्याच्या देयकाची नोंदवही', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-21' },
      { number: 22, name: 'Immovable Property Register', nameMr: 'स्थावर मालमत्ता नोंदवही', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-22' },
      { number: 23, name: 'Road Register', nameMr: 'ताब्यातील रस्त्यांची नोंदवही', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-23' },
      { number: 24, name: 'Land Register', nameMr: 'जमिनीची नोंदवही', status: totalCollectionEntries > 0 ? 'partial' : 'none', viewId: 'namuna-24' },
      { number: 25, name: 'Investment Register', nameMr: 'गुंतवणूक नोंदवही', status: 'none', viewId: 'namuna-25' },
      { number: 26, name: 'Monthly Statement', nameMr: 'मासिक विवरण', status: 'none', viewId: 'namuna-26ka' },
      { number: 27, name: 'Audit Objection Compliance Statement', nameMr: 'लेखापरीक्षण आक्षेपांच्या पुर्तेचे मासिक विवरण', status: 'none', viewId: 'namuna-27' },
      { number: 28, name: 'SC 15% & Women/Child Welfare 10%', nameMr: 'मागासवर्गीय 15% व महिला बालकल्याण 10% खर्चाचे मासिक विवरण', status: totalSchemes > 0 ? 'partial' : 'none', viewId: 'namuna-28' },
      { number: 29, name: 'Loan Register', nameMr: 'कर्जाची नोंदवही', status: totalSchemes > 0 ? 'partial' : 'none', viewId: 'namuna-29' },
      { number: 30, name: 'Audit Objection Compliance Register', nameMr: 'लेखा परीक्षण आक्षेप पूर्तता नोंदवही', status: totalSchemes > 0 ? 'partial' : 'none', viewId: 'namuna-30' },
      { number: 31, name: 'Travel Allowance Bill', nameMr: 'प्रवास भत्ता देयक', status: 'none', viewId: 'namuna-31' },
      { number: 32, name: 'Refund Order', nameMr: 'रकमेच्या परताव्यासाठीचा आदेश', status: 'none', viewId: 'namuna-32' },
      { number: 33, name: 'Tree Register', nameMr: 'वृक्ष नोंदवही', status: 'none', viewId: 'namuna-33' },
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
