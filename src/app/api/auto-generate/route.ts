import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: round to 2 decimal places
const r2 = (n: number) => Math.round(n * 100) / 100;

// Helper: group array by key
function groupBy<T>(arr: T[], key: keyof T): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of arr) {
    const k = String(item[key] ?? 'Other');
    result[k] = (result[k] || 0) + 1;
  }
  return result;
}

// Helper: group and sum
function groupAndSum<T>(arr: T[], groupKey: keyof T, sumKey: keyof T): { key: string; total: number }[] {
  const map = new Map<string, number>();
  for (const item of arr) {
    const k = String(item[groupKey] ?? 'Unassigned');
    const v = Number(item[sumKey] ?? 0);
    map.set(k, (map.get(k) || 0) + v);
  }
  return Array.from(map.entries()).map(([key, total]) => ({ key, total: r2(total) }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const namuna = searchParams.get('namuna') || '1';
  const financialYear = searchParams.get('financialYear') || '2024-25';

  try {
    // Summary endpoint
    if (namuna === 'all') {
      return await generateSummary(financialYear);
    }

    const namunaNum = parseInt(namuna, 10);
    if (isNaN(namunaNum) || namunaNum < 1 || namunaNum > 33) {
      return NextResponse.json({ error: 'Invalid namuna number. Must be 1-33 or "all"' }, { status: 400 });
    }

    let data;
    switch (namunaNum) {
      case 1: data = await generateNamuna1(financialYear); break;
      case 2: data = await generateNamuna2(financialYear); break;
      case 3: data = await generateNamuna3(financialYear); break;
      case 4: data = await generateNamuna4(financialYear); break;
      case 5: data = await generateNamuna5(financialYear); break;
      case 6: data = await generateNamuna6(financialYear); break;
      case 7: data = await generateNamuna7(financialYear); break;
      case 8: data = await generateNamuna8(financialYear); break;
      case 9: data = await generateNamuna9(financialYear); break;
      case 10: data = await generateNamuna10(financialYear); break;
      case 11: data = await generateNamuna11(financialYear); break;
      case 12: data = await generateNamuna12(financialYear); break;
      case 13: data = await generateNamuna13(financialYear); break;
      case 14: data = await generateNamuna14(financialYear); break;
      case 15: data = await generateNamuna15(financialYear); break;
      case 16: data = await generateNamuna16(financialYear); break;
      case 17: data = await generateNamuna17(financialYear); break;
      case 18: data = await generateNamuna18(financialYear); break;
      case 19: data = await generateNamuna19(financialYear); break;
      case 20: data = await generateNamuna20(financialYear); break;
      case 21: data = await generateNamuna21(financialYear); break;
      case 22: data = await generateNamuna22(financialYear); break;
      case 23: data = await generateNamuna23(financialYear); break;
      case 24: data = await generateNamuna24(financialYear); break;
      case 25: data = await generateNamuna25(financialYear); break;
      case 26: data = await generateNamuna26(financialYear); break;
      case 27: data = await generateNamuna27(financialYear); break;
      case 28: data = await generateNamuna28(financialYear); break;
      case 29: data = await generateNamuna29(financialYear); break;
      case 30: data = await generateNamuna30(financialYear); break;
      case 31: data = await generateNamuna31(financialYear); break;
      case 32: data = await generateNamuna32(financialYear); break;
      case 33: data = await generateNamuna33(financialYear); break;
      default: data = { error: 'Invalid namuna number' };
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Auto-generate error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// ============================================================
// NAMUNA 1 - अंदाजपत्रक मालमत्ता पत्र (Budget Assets Sheet)
// Budget data grouped by income/expenditure heads from BudgetEntry
// ============================================================
async function generateNamuna1(fy: string) {
  const [budgetEntries, village] = await Promise.all([
    db.budgetEntry.findMany({ where: { financialYear: fy }, orderBy: { budgetHeadCode: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const incomeEntries = budgetEntries.filter(b => b.category === 'income');
  const expenditureEntries = budgetEntries.filter(b => b.category === 'expenditure');

  const rows = budgetEntries.map(b => ({
    code: b.budgetHeadCode,
    name: b.budgetHeadName || '',
    nameMr: b.budgetHeadNameMr || '',
    category: b.category,
    type: b.type,
    originalBudget: b.originalBudget,
    revisedBudget: b.revisedBudget,
    actualAmount: b.actualAmount,
    variance: r2((b.revisedBudget || b.originalBudget) - b.actualAmount),
  }));

  return {
    title: 'नमुना १ - अंदाजपत्रक मालमत्ता पत्र',
    titleEn: 'Namuna 1 - Budget Assets Sheet',
    headers: ['खाते कोड', 'खाते नाव', 'श्रेणी', 'प्रकार', 'मूळ अंदाज (₹)', 'दुरुस्तीत अंदाज (₹)', 'वास्तव रक्कम (₹)', 'फरक (₹)'],
    rows,
    totals: {
      totalOriginalBudget: r2(budgetEntries.reduce((s, b) => s + b.originalBudget, 0)),
      totalRevisedBudget: r2(budgetEntries.reduce((s, b) => s + b.revisedBudget, 0)),
      totalActualAmount: r2(budgetEntries.reduce((s, b) => s + b.actualAmount, 0)),
      incomeOriginal: r2(incomeEntries.reduce((s, b) => s + b.originalBudget, 0)),
      expenditureOriginal: r2(expenditureEntries.reduce((s, b) => s + b.originalBudget, 0)),
    },
    meta: { village, financialYear: fy, totalEntries: budgetEntries.length },
  };
}

// ============================================================
// NAMUNA 2 - अंदाजपत्रक उत्पन्न व खर्च (Budget Income vs Expenditure)
// ============================================================
async function generateNamuna2(fy: string) {
  const [budgetEntries, village] = await Promise.all([
    db.budgetEntry.findMany({ where: { financialYear: fy }, orderBy: [{ category: 'asc' }, { budgetHeadCode: 'asc' }] }),
    db.villageInfo.findFirst(),
  ]);

  const incomeRows = budgetEntries.filter(b => b.category === 'income').map(b => ({
    code: b.budgetHeadCode,
    name: b.budgetHeadName || '',
    nameMr: b.budgetHeadNameMr || '',
    type: b.type,
    budget: b.revisedBudget || b.originalBudget,
    actual: b.actualAmount,
    variance: r2((b.revisedBudget || b.originalBudget) - b.actualAmount),
  }));

  const expenditureRows = budgetEntries.filter(b => b.category === 'expenditure').map(b => ({
    code: b.budgetHeadCode,
    name: b.budgetHeadName || '',
    nameMr: b.budgetHeadNameMr || '',
    type: b.type,
    budget: b.revisedBudget || b.originalBudget,
    actual: b.actualAmount,
    variance: r2((b.revisedBudget || b.originalBudget) - b.actualAmount),
  }));

  const totalIncomeBudget = incomeRows.reduce((s, r) => s + r.budget, 0);
  const totalIncomeActual = incomeRows.reduce((s, r) => s + r.actual, 0);
  const totalExpenditureBudget = expenditureRows.reduce((s, r) => s + r.budget, 0);
  const totalExpenditureActual = expenditureRows.reduce((s, r) => s + r.actual, 0);

  return {
    title: 'नमुना २ - अंदाजपत्रक उत्पन्न व खर्च',
    titleEn: 'Namuna 2 - Budget Income vs Expenditure',
    headers: ['खाते कोड', 'खाते नाव', 'प्रकार', 'अंदाज (₹)', 'वास्तव (₹)', 'फरक (₹)'],
    incomeRows,
    expenditureRows,
    totals: {
      totalIncomeBudget: r2(totalIncomeBudget),
      totalIncomeActual: r2(totalIncomeActual),
      totalExpenditureBudget: r2(totalExpenditureBudget),
      totalExpenditureActual: r2(totalExpenditureActual),
      surplusBudget: r2(totalIncomeBudget - totalExpenditureBudget),
      surplusActual: r2(totalIncomeActual - totalExpenditureActual),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 3 - रोकड वही (Cash Book)
// All ReceiptEntry + PaymentEntry sorted by date with running balance
// ============================================================
async function generateNamuna3(fy: string) {
  const [receipts, payments, village] = await Promise.all([
    db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } }),
    db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const allEntries = [
    ...receipts.map(r => ({
      date: r.receiptDate,
      voucher: r.voucherNumber,
      type: 'Receipt' as const,
      typeMr: 'जमा',
      particulars: r.receivedFrom || r.description || '',
      debit: r.amount,
      credit: 0,
      head: r.headOfAccount || '',
      headMr: r.headOfAccountMr || '',
      paymentMethod: r.paymentMethod,
    })),
    ...payments.map(p => ({
      date: p.paymentDate,
      voucher: p.voucherNumber,
      type: 'Payment' as const,
      typeMr: 'नामे',
      particulars: p.paidTo || p.description || '',
      debit: 0,
      credit: p.amount,
      head: p.headOfAccount || '',
      headMr: p.headOfAccountMr || '',
      paymentMethod: p.paymentMethod,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const rows = allEntries.map(e => {
    balance += e.debit - e.credit;
    return { ...e, balance: r2(balance) };
  });

  const totalDebit = allEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = allEntries.reduce((s, e) => s + e.credit, 0);

  return {
    title: 'नमुना ३ - रोकड वही',
    titleEn: 'Namuna 3 - Cash Book',
    headers: ['दिनांक', 'वाउचर क्र.', 'प्रकार', 'विवरण', 'जमा (₹)', 'नामे (₹)', 'शिल्लक (₹)', 'खाते शीर्ष'],
    rows,
    totals: {
      totalDebit: r2(totalDebit),
      totalCredit: r2(totalCredit),
      closingBalance: r2(balance),
      receiptCount: receipts.length,
      paymentCount: payments.length,
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 4 - बँक वही (Bank Book)
// ============================================================
async function generateNamuna4(fy: string) {
  const [bankReceipts, bankPayments, bankAccounts, village] = await Promise.all([
    db.receiptEntry.findMany({
      where: { financialYear: fy, bankAccountId: { not: null } },
      orderBy: { receiptDate: 'asc' },
    }),
    db.paymentEntry.findMany({
      where: { financialYear: fy, bankAccountId: { not: null } },
      orderBy: { paymentDate: 'asc' },
    }),
    db.bankAccount.findMany({ where: { isActive: true } }),
    db.villageInfo.findFirst(),
  ]);

  const bankMap = new Map(bankAccounts.map(b => [b.id, b]));

  const allEntries = [
    ...bankReceipts.map(r => ({
      date: r.receiptDate,
      voucher: r.voucherNumber,
      type: 'Deposit' as const,
      typeMr: 'ठेव',
      particulars: r.receivedFrom || r.description || '',
      deposit: r.amount,
      withdrawal: 0,
      bankName: r.bankAccountId ? bankMap.get(r.bankAccountId)?.bankName || '' : '',
      accountNumber: r.bankAccountId ? bankMap.get(r.bankAccountId)?.accountNumber || '' : '',
      chequeNumber: r.chequeNumber || '',
    })),
    ...bankPayments.map(p => ({
      date: p.paymentDate,
      voucher: p.voucherNumber,
      type: 'Withdrawal' as const,
      typeMr: 'उधार',
      particulars: p.paidTo || p.description || '',
      deposit: 0,
      withdrawal: p.amount,
      bankName: p.bankAccountId ? bankMap.get(p.bankAccountId)?.bankName || '' : '',
      accountNumber: p.bankAccountId ? bankMap.get(p.bankAccountId)?.accountNumber || '' : '',
      chequeNumber: p.chequeNumber || '',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const rows = allEntries.map(e => {
    balance += e.deposit - e.withdrawal;
    return { ...e, balance: r2(balance) };
  });

  const totalDeposits = allEntries.reduce((s, e) => s + e.deposit, 0);
  const totalWithdrawals = allEntries.reduce((s, e) => s + e.withdrawal, 0);

  return {
    title: 'नमुना ४ - बँक वही',
    titleEn: 'Namuna 4 - Bank Book',
    headers: ['दिनांक', 'वाउचर क्र.', 'प्रकार', 'विवरण', 'ठेव (₹)', 'उधार (₹)', 'शिल्लक (₹)', 'बँक', 'चेक क्र.'],
    rows,
    totals: {
      totalDeposits: r2(totalDeposits),
      totalWithdrawals: r2(totalWithdrawals),
      closingBalance: r2(balance),
      bankCount: bankAccounts.length,
    },
    meta: { village, financialYear: fy, bankAccounts },
  };
}

// ============================================================
// NAMUNA 5 - मालमत्ता रजिस्टर (Asset Register)
// ============================================================
async function generateNamuna5(fy: string) {
  const [assets, village] = await Promise.all([
    db.assetEntry.findMany({ orderBy: { assetNumber: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const rows = assets.map(a => {
    const depRate = a.depreciationRate || 10;
    const age = a.purchaseDate ? Math.max(0, new Date().getFullYear() - new Date(a.purchaseDate).getFullYear()) : 0;
    const depreciatedValue = a.purchaseCost * Math.pow(1 - depRate / 100, age);
    const totalDepreciation = a.purchaseCost - depreciatedValue;

    return {
      assetNumber: a.assetNumber,
      assetName: a.assetName,
      assetNameMr: a.assetNameMr,
      assetType: a.assetType || 'Other',
      purchaseDate: a.purchaseDate || '',
      purchaseCost: a.purchaseCost,
      depreciationRate: depRate,
      age,
      totalDepreciation: r2(totalDepreciation),
      currentValue: r2(Math.max(depreciatedValue, a.currentValue)),
      location: a.location || '',
      status: a.status,
    };
  });

  return {
    title: 'नमुना ५ - मालमत्ता रजिस्टर',
    titleEn: 'Namuna 5 - Asset Register',
    headers: ['मालमत्ता क्र.', 'नाव', 'प्रकार', 'खरेदी दिनांक', 'खरेदी किंमत (₹)', 'घसारा दर %', 'वय', 'एकूण घसारा (₹)', 'चलन किंमत (₹)', 'स्थिती'],
    rows,
    totals: {
      totalAssets: assets.length,
      totalPurchaseCost: r2(rows.reduce((s, r) => s + r.purchaseCost, 0)),
      totalDepreciation: r2(rows.reduce((s, r) => s + r.totalDepreciation, 0)),
      totalCurrentValue: r2(rows.reduce((s, r) => s + r.currentValue, 0)),
      byType: groupBy(assets, 'assetType'),
      byStatus: groupBy(assets, 'status'),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 6 - साठा रजिस्टर (Stock Register)
// ============================================================
async function generateNamuna6(fy: string) {
  const [stocks, village] = await Promise.all([
    db.stockEntry.findMany({ orderBy: { stockNumber: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const rows = stocks.map(s => ({
    stockNumber: s.stockNumber,
    itemName: s.itemName,
    itemNameMr: s.itemNameMr,
    category: s.category || 'Other',
    quantity: s.quantity,
    unit: s.unit || '',
    unitPrice: s.unitPrice,
    totalValue: s.totalValue,
    receivedDate: s.receivedDate || '',
    issuedDate: s.issuedDate || '',
    issuedTo: s.issuedTo || '',
    status: s.status,
  }));

  return {
    title: 'नमुना ६ - साठा रजिस्टर',
    titleEn: 'Namuna 6 - Stock Register',
    headers: ['साठा क्र.', 'वस्तूचे नाव', 'वर्ग', 'प्रमाण', 'एकक', 'एकक किंमत (₹)', 'एकूण मूल्य (₹)', 'प्राप्ती दिनांक', 'जारी दिनांक', 'जारी कोणाला', 'स्थिती'],
    rows,
    totals: {
      totalItems: stocks.length,
      totalValue: r2(stocks.reduce((s, st) => s + st.totalValue, 0)),
      totalQuantity: stocks.reduce((s, st) => s + st.quantity, 0),
      inStockCount: stocks.filter(s => s.status === 'In Stock').length,
      byCategory: groupBy(stocks, 'category'),
      byStatus: groupBy(stocks, 'status'),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 7 - अनुदान नोंदवही (Grant Register)
// ============================================================
async function generateNamuna7(fy: string) {
  const [schemeFunds, schemes, village] = await Promise.all([
    db.schemeFundEntry.findMany({ where: { financialYear: fy }, orderBy: { entryDate: 'asc' } }),
    db.schemeInfo.findMany(),
    db.villageInfo.findFirst(),
  ]);

  const schemeMap = new Map(schemes.map(s => [s.id, s]));

  const rows = schemeFunds.map(sf => ({
    voucherNumber: sf.voucherNumber,
    date: sf.entryDate,
    schemeName: sf.schemeId ? schemeMap.get(sf.schemeId)?.schemeName || '' : '',
    schemeNameMr: sf.schemeId ? schemeMap.get(sf.schemeId)?.schemeNameMr || '' : '',
    entryType: sf.entryType,
    entryTypeMr: sf.entryType === 'Receipt' ? 'प्राप्ती' : 'अर्ज',
    amount: sf.amount,
    description: sf.description || '',
  }));

  const byScheme = new Map<string, { name: string; nameMr: string; receipts: number; payments: number }>();
  for (const sf of schemeFunds) {
    const key = sf.schemeId || 'none';
    const scheme = sf.schemeId ? schemeMap.get(sf.schemeId) : null;
    if (!byScheme.has(key)) {
      byScheme.set(key, { name: scheme?.schemeName || 'Unassigned', nameMr: scheme?.schemeNameMr || '', receipts: 0, payments: 0 });
    }
    const entry = byScheme.get(key)!;
    if (sf.entryType === 'Receipt') entry.receipts += sf.amount;
    else entry.payments += sf.amount;
  }

  const totalReceipts = schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((s, sf) => s + sf.amount, 0);
  const totalPayments = schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((s, sf) => s + sf.amount, 0);

  return {
    title: 'नमुना ७ - अनुदान नोंदवही',
    titleEn: 'Namuna 7 - Grant Register',
    headers: ['वाउचर क्र.', 'दिनांक', 'योजना', 'प्रकार', 'रक्कम (₹)', 'विवरण'],
    rows,
    totals: {
      totalEntries: schemeFunds.length,
      totalReceipts: r2(totalReceipts),
      totalPayments: r2(totalPayments),
      balance: r2(totalReceipts - totalPayments),
      byScheme: Array.from(byScheme.entries()).map(([id, v]) => ({ id, ...v, balance: r2(v.receipts - v.payments) })),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 8 - कर आकारणी (Tax Assessment)
// ============================================================
async function generateNamuna8(fy: string) {
  const [namuna8s, village] = await Promise.all([
    db.taxAssessment.findMany({
      where: { financialYear: fy },
      include: { property: { include: { ward: true, owners: { include: { owner: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.villageInfo.findFirst(),
  ]);

  const rows = namuna8s.map(n => {
    const primaryOwner = n.property.owners.find(o => o.ownershipType === 'मालक') || n.property.owners[0];
    return {
      propertyNumber: n.property.propertyNumber,
      ownerName: primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : '',
      wardName: n.property.ward?.wardNameMr || n.property.ward?.wardName || '',
      constructionType: n.property.constructionType || '',
      usageType: n.property.usageType || '',
      area: n.property.area || 0,
      capitalValue: n.capitalValue || 0,
      houseTax: n.houseTaxAmt || 0,
      lightTax: n.lightTaxAmt || 0,
      healthTax: n.healthTaxAmt || 0,
      waterTax: n.waterTaxAmt || 0,
      totalTax: n.totalTaxAmt || n.totalTax,
    };
  });

  return {
    title: 'नमुना ८ - कर आकारणी नोंदवही',
    titleEn: 'Namuna 8 - Tax Assessment Register',
    headers: ['मालमत्ता क्र.', 'मालक', 'वार्ड', 'बांधकाम', 'वापर', 'क्षेत्रफळ', 'भांडवली मूल्य (₹)', 'गृहकर (₹)', 'दिवाबती (₹)', 'आरोग्य (₹)', 'पाणी (₹)', 'एकूण कर (₹)'],
    rows,
    totals: {
      totalEntries: namuna8s.length,
      totalTax: r2(namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0)),
      totalHouseTax: r2(namuna8s.reduce((s, n) => s + (n.houseTaxAmt || 0), 0)),
      totalLightTax: r2(namuna8s.reduce((s, n) => s + (n.lightTaxAmt || 0), 0)),
      totalHealthTax: r2(namuna8s.reduce((s, n) => s + (n.healthTaxAmt || 0), 0)),
      totalWaterTax: r2(namuna8s.reduce((s, n) => s + (n.waterTaxAmt || 0), 0)),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 9 - मागणी नोंदवही (Demand Register)
// ============================================================
async function generateNamuna9(fy: string) {
  const [namuna9s, village] = await Promise.all([
    db.demandRegister.findMany({
      where: { financialYear: fy },
      include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, payments: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.villageInfo.findFirst(),
  ]);

  const rows = namuna9s.map(n => {
    const primaryOwner = n.property.owners.find(o => o.ownershipType === 'मालक') || n.property.owners[0];
    const totalPaid = n.payments.reduce((s, p) => s + p.amountPaid, 0);
    return {
      propertyNumber: n.property.propertyNumber,
      ownerName: primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : '',
      wardName: n.property.ward?.wardNameMr || n.property.ward?.wardName || '',
      currentTax: n.currentTax,
      previousBalance: n.previousBalance,
      penalty: n.penalty,
      interest: n.interest,
      totalDemand: n.totalDemand,
      totalPaid: r2(totalPaid),
      outstanding: r2(n.totalDemand - totalPaid),
    };
  });

  return {
    title: 'नमुना ९ - मागणी नोंदवही',
    titleEn: 'Namuna 9 - Demand Register',
    headers: ['मालमत्ता क्र.', 'मालक', 'वार्ड', 'चालू कर (₹)', 'मागील थकबाकी (₹)', 'दंड (₹)', 'व्याज (₹)', 'एकूण मागणी (₹)', 'वसूल (₹)', 'शिल्लक (₹)'],
    rows,
    totals: {
      totalEntries: namuna9s.length,
      totalDemand: r2(rows.reduce((s, r) => s + r.totalDemand, 0)),
      totalPaid: r2(rows.reduce((s, r) => s + r.totalPaid, 0)),
      totalOutstanding: r2(rows.reduce((s, r) => s + r.outstanding, 0)),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 10 - थकबाकी/DCB (Demand Collection Balance)
// ============================================================
async function generateNamuna10(fy: string) {
  const [demands, village] = await Promise.all([
    db.demandRegister.findMany({
      where: { financialYear: fy },
      include: { property: { include: { owners: { include: { owner: true } }, ward: true } }, payments: true },
    }),
    db.villageInfo.findFirst(),
  ]);

  const paymentMap = new Map<string, number>();
  for (const d of demands) {
    const totalPaid = d.payments.reduce((s, p) => s + p.amountPaid, 0);
    paymentMap.set(d.id, totalPaid);
  }

  const rows = demands.map(d => {
    const collected = paymentMap.get(d.id) || 0;
    const balance = d.totalDemand - collected;
    const primaryOwner = d.property.owners.find(o => o.ownershipType === 'मालक') || d.property.owners[0];
    return {
      propertyNumber: d.property.propertyNumber,
      ownerName: primaryOwner?.owner?.firstNameMr || primaryOwner?.owner?.firstName || '-',
      wardName: d.property.ward?.wardNameMr || '-',
      demand: d.totalDemand,
      collected: r2(collected),
      balance: r2(balance),
    };
  });

  return {
    title: 'नमुना १० - मागणी, वसूल व शिल्लक',
    titleEn: 'Namuna 10 - DCB (Demand Collection Balance)',
    headers: ['मालमत्ता क्र.', 'मालक', 'वार्ड', 'मागणी (₹)', 'वसूल (₹)', 'शिल्लक (₹)'],
    rows,
    totals: {
      totalDemand: r2(rows.reduce((s, r) => s + r.demand, 0)),
      totalCollected: r2(rows.reduce((s, r) => s + r.collected, 0)),
      totalBalance: r2(rows.reduce((s, r) => s + r.balance, 0)),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 11 - दैनंदिन रोकड वही (Daily Cash Summary)
// ============================================================
async function generateNamuna11(fy: string) {
  const [receipts, payments, village] = await Promise.all([
    db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } }),
    db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const dateMap = new Map<string, { date: string; totalReceipt: number; totalPayment: number; receiptCount: number; paymentCount: number }>();

  for (const r of receipts) {
    const key = r.receiptDate;
    if (!dateMap.has(key)) dateMap.set(key, { date: key, totalReceipt: 0, totalPayment: 0, receiptCount: 0, paymentCount: 0 });
    const entry = dateMap.get(key)!;
    entry.totalReceipt += r.amount;
    entry.receiptCount++;
  }

  for (const p of payments) {
    const key = p.paymentDate;
    if (!dateMap.has(key)) dateMap.set(key, { date: key, totalReceipt: 0, totalPayment: 0, receiptCount: 0, paymentCount: 0 });
    const entry = dateMap.get(key)!;
    entry.totalPayment += p.amount;
    entry.paymentCount++;
  }

  const sortedRows = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = 0;
  const rows = sortedRows.map(r => {
    runningBalance += r.totalReceipt - r.totalPayment;
    return { ...r, totalReceipt: r2(r.totalReceipt), totalPayment: r2(r.totalPayment), balance: r2(runningBalance) };
  });

  return {
    title: 'नमुना ११ - दैनंदिन रोकड वही',
    titleEn: 'Namuna 11 - Daily Cash Summary',
    headers: ['दिनांक', 'एकूण प्राप्ती (₹)', 'प्राप्ती एंट्री', 'एकूण अर्ज (₹)', 'अर्ज एंट्री', 'शिल्लक (₹)'],
    rows,
    totals: {
      totalReceipts: r2(receipts.reduce((s, r) => s + r.amount, 0)),
      totalPayments: r2(payments.reduce((s, p) => s + p.amount, 0)),
      closingBalance: r2(runningBalance),
      totalDays: rows.length,
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 12 - जमा खाते रजिस्टर (Credit Account Register)
// ============================================================
async function generateNamuna12(fy: string) {
  const [ledgerEntries, receipts, village] = await Promise.all([
    db.ledgerEntry.findMany({ where: { financialYear: fy, creditAmount: { gt: 0 } }, orderBy: { entryDate: 'asc' } }),
    db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  let rows;
  if (ledgerEntries.length > 0) {
    rows = ledgerEntries.map(le => ({
      date: le.entryDate,
      voucher: le.voucherNumber,
      voucherType: le.voucherType,
      accountCode: le.accountCode,
      accountName: le.accountName || le.accountNameMr || le.accountCode,
      creditAmount: le.creditAmount,
      description: le.description || '',
    }));
  } else {
    rows = receipts.map(r => ({
      date: r.receiptDate,
      voucher: r.voucherNumber,
      voucherType: 'Receipt',
      accountCode: r.headOfAccount || '',
      accountName: r.headOfAccountMr || r.headOfAccount || '',
      creditAmount: r.amount,
      description: r.receivedFrom || r.description || '',
    }));
  }

  return {
    title: 'नमुना १२ - जमा खाते रजिस्टर',
    titleEn: 'Namuna 12 - Credit Account Register',
    headers: ['दिनांक', 'वाउचर क्र.', 'वाउचर प्रकार', 'खाते कोड', 'खाते नाव', 'जमा रक्कम (₹)', 'विवरण'],
    rows,
    totals: {
      totalCredit: r2(rows.reduce((s, r) => s + r.creditAmount, 0)),
      totalEntries: rows.length,
      source: ledgerEntries.length > 0 ? 'ledger' : 'receipts',
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 13 - नामे खाते रजिस्टर (Debit Account Register)
// ============================================================
async function generateNamuna13(fy: string) {
  const [ledgerEntries, payments, village] = await Promise.all([
    db.ledgerEntry.findMany({ where: { financialYear: fy, debitAmount: { gt: 0 } }, orderBy: { entryDate: 'asc' } }),
    db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  let rows;
  if (ledgerEntries.length > 0) {
    rows = ledgerEntries.map(le => ({
      date: le.entryDate,
      voucher: le.voucherNumber,
      voucherType: le.voucherType,
      accountCode: le.accountCode,
      accountName: le.accountName || le.accountNameMr || le.accountCode,
      debitAmount: le.debitAmount,
      description: le.description || '',
    }));
  } else {
    rows = payments.map(p => ({
      date: p.paymentDate,
      voucher: p.voucherNumber,
      voucherType: 'Payment',
      accountCode: p.headOfAccount || '',
      accountName: p.headOfAccountMr || p.headOfAccount || '',
      debitAmount: p.amount,
      description: p.paidTo || p.description || '',
    }));
  }

  return {
    title: 'नमुना १३ - नामे खाते रजिस्टर',
    titleEn: 'Namuna 13 - Debit Account Register',
    headers: ['दिनांक', 'वाउचर क्र.', 'वाउचर प्रकार', 'खाते कोड', 'खाते नाव', 'नामे रक्कम (₹)', 'विवरण'],
    rows,
    totals: {
      totalDebit: r2(rows.reduce((s, r) => s + r.debitAmount, 0)),
      totalEntries: rows.length,
      source: ledgerEntries.length > 0 ? 'ledger' : 'payments',
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 14 - खाते खत (Ledger)
// ============================================================
async function generateNamuna14(fy: string) {
  const [ledgerEntries, receipts, payments, journals, village] = await Promise.all([
    db.ledgerEntry.findMany({ where: { financialYear: fy }, orderBy: [{ accountCode: 'asc' }, { entryDate: 'asc' }] }),
    db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } }),
    db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } }),
    db.voucherEntry.findMany({ where: { financialYear: fy }, orderBy: { entryDate: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  let rows;
  if (ledgerEntries.length > 0) {
    rows = ledgerEntries.map(le => ({
      date: le.entryDate,
      voucher: le.voucherNumber,
      voucherType: le.voucherType,
      accountCode: le.accountCode,
      accountName: le.accountName || le.accountNameMr || le.accountCode,
      debitAmount: le.debitAmount,
      creditAmount: le.creditAmount,
      balance: le.balance,
      description: le.description || '',
    }));
  } else {
    const combinedEntries = [
      ...receipts.map(r => ({
        date: r.receiptDate, voucher: r.voucherNumber, voucherType: 'Receipt' as const,
        accountCode: r.headOfAccount || 'Income', accountName: r.headOfAccountMr || r.headOfAccount || 'Income',
        debitAmount: 0, creditAmount: r.amount, description: r.receivedFrom || r.description || '',
      })),
      ...payments.map(p => ({
        date: p.paymentDate, voucher: p.voucherNumber, voucherType: 'Payment' as const,
        accountCode: p.headOfAccount || 'Expenditure', accountName: p.headOfAccountMr || p.headOfAccount || 'Expenditure',
        debitAmount: p.amount, creditAmount: 0, description: p.paidTo || p.description || '',
      })),
      ...journals.map(j => ({
        date: j.entryDate, voucher: j.voucherNumber, voucherType: 'Journal' as const,
        accountCode: j.debitAccount || 'Journal', accountName: j.description || 'Journal Entry',
        debitAmount: j.amount, creditAmount: 0, description: j.description || '',
      })),
    ].sort((a, b) => a.accountCode.localeCompare(b.accountCode) || a.date.localeCompare(b.date));
    rows = combinedEntries.map(e => ({ ...e, balance: r2(e.debitAmount - e.creditAmount) }));
  }

  const accountGroups = new Map<string, { code: string; name: string; totalDebit: number; totalCredit: number }>();
  for (const row of rows) {
    const key = row.accountCode;
    if (!accountGroups.has(key)) accountGroups.set(key, { code: key, name: row.accountName, totalDebit: 0, totalCredit: 0 });
    const g = accountGroups.get(key)!;
    g.totalDebit += row.debitAmount;
    g.totalCredit += row.creditAmount;
  }

  return {
    title: 'नमुना १४ - खाते खत',
    titleEn: 'Namuna 14 - Ledger',
    headers: ['दिनांक', 'वाउचर क्र.', 'प्रकार', 'खाते कोड', 'खाते नाव', 'नामे (₹)', 'जमा (₹)', 'शिल्लक (₹)', 'विवरण'],
    rows,
    accountGroups: Array.from(accountGroups.values()).map(g => ({
      ...g, totalDebit: r2(g.totalDebit), totalCredit: r2(g.totalCredit), netBalance: r2(g.totalDebit - g.totalCredit),
    })),
    totals: {
      totalDebit: r2(rows.reduce((s, r) => s + r.debitAmount, 0)),
      totalCredit: r2(rows.reduce((s, r) => s + r.creditAmount, 0)),
      totalAccounts: accountGroups.size,
      source: ledgerEntries.length > 0 ? 'ledger' : 'transactions',
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 15 - तपासणी पत्र (Trial Balance)
// ============================================================
async function generateNamuna15(fy: string) {
  const [ledgerEntries, receipts, payments, journals, village] = await Promise.all([
    db.ledgerEntry.findMany({ where: { financialYear: fy } }),
    db.receiptEntry.findMany({ where: { financialYear: fy } }),
    db.paymentEntry.findMany({ where: { financialYear: fy } }),
    db.voucherEntry.findMany({ where: { financialYear: fy } }),
    db.villageInfo.findFirst(),
  ]);

  const accountMap = new Map<string, { code: string; name: string; totalDebit: number; totalCredit: number }>();

  if (ledgerEntries.length > 0) {
    for (const entry of ledgerEntries) {
      const key = entry.accountCode;
      if (!accountMap.has(key)) accountMap.set(key, { code: entry.accountCode, name: entry.accountName || entry.accountNameMr || entry.accountCode, totalDebit: 0, totalCredit: 0 });
      const acc = accountMap.get(key)!;
      acc.totalDebit += entry.debitAmount;
      acc.totalCredit += entry.creditAmount;
    }
  } else {
    for (const r of receipts) {
      const key = r.headOfAccount || 'Income';
      if (!accountMap.has(key)) accountMap.set(key, { code: key, name: r.headOfAccountMr || key, totalDebit: 0, totalCredit: 0 });
      accountMap.get(key)!.totalCredit += r.amount;
    }
    for (const p of payments) {
      const key = p.headOfAccount || 'Expenditure';
      if (!accountMap.has(key)) accountMap.set(key, { code: key, name: p.headOfAccountMr || key, totalDebit: 0, totalCredit: 0 });
      accountMap.get(key)!.totalDebit += p.amount;
    }
    for (const j of journals) {
      const debitKey = j.debitAccount || 'Journal Debit';
      const creditKey = j.creditAccount || 'Journal Credit';
      if (!accountMap.has(debitKey)) accountMap.set(debitKey, { code: debitKey, name: debitKey, totalDebit: 0, totalCredit: 0 });
      if (!accountMap.has(creditKey)) accountMap.set(creditKey, { code: creditKey, name: creditKey, totalDebit: 0, totalCredit: 0 });
      accountMap.get(debitKey)!.totalDebit += j.amount;
      accountMap.get(creditKey)!.totalCredit += j.amount;
    }
  }

  const rows = Array.from(accountMap.values()).map(r => ({
    ...r, totalDebit: r2(r.totalDebit), totalCredit: r2(r.totalCredit),
    balance: r2(r.totalDebit - r.totalCredit),
    balanceType: r.totalDebit > r.totalCredit ? 'Debit' : 'Credit',
  }));

  return {
    title: 'नमुना १५ - तपासणी पत्र',
    titleEn: 'Namuna 15 - Trial Balance',
    headers: ['खाते कोड', 'खाते नाव', 'जमा (₹)', 'नामे (₹)', 'शिल्लक (₹)', 'शिल्लक प्रकार'],
    rows,
    totals: {
      totalDebit: r2(rows.reduce((s, r) => s + r.totalDebit, 0)),
      totalCredit: r2(rows.reduce((s, r) => s + r.totalCredit, 0)),
      difference: r2(rows.reduce((s, r) => s + r.totalDebit, 0) - rows.reduce((s, r) => s + r.totalCredit, 0)),
      totalAccounts: rows.length,
      source: ledgerEntries.length > 0 ? 'ledger' : 'transactions',
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 16 - मालमत्ता वही (Asset Verification)
// ============================================================
async function generateNamuna16(fy: string) {
  const [assets, village] = await Promise.all([
    db.assetEntry.findMany({ orderBy: { assetNumber: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const rows = assets.map(a => ({
    assetNumber: a.assetNumber,
    assetName: a.assetName,
    assetNameMr: a.assetNameMr,
    assetType: a.assetType || 'Other',
    purchaseDate: a.purchaseDate || '',
    purchaseCost: a.purchaseCost,
    currentValue: a.currentValue,
    depreciation: r2(a.purchaseCost - a.currentValue),
    location: a.location || a.locationMr || '',
    status: a.status,
    verified: a.status === 'Active',
  }));

  return {
    title: 'नमुना १६ - मालमत्ता वही',
    titleEn: 'Namuna 16 - Asset Verification Register',
    headers: ['क्र.', 'नाव', 'प्रकार', 'खरेदी दिनांक', 'खरेदी किंमत (₹)', 'चलन किंमत (₹)', 'घसारा (₹)', 'स्थान', 'स्थिती', 'पडताळणी'],
    rows,
    totals: {
      totalAssets: assets.length,
      totalPurchaseCost: r2(assets.reduce((s, a) => s + a.purchaseCost, 0)),
      totalCurrentValue: r2(assets.reduce((s, a) => s + a.currentValue, 0)),
      totalDepreciation: r2(assets.reduce((s, a) => s + (a.purchaseCost - a.currentValue), 0)),
      activeCount: assets.filter(a => a.status === 'Active').length,
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 17 - देताणी वही (Liabilities Register)
// ============================================================
async function generateNamuna17(fy: string) {
  const [budgetEntries, payments, village] = await Promise.all([
    db.budgetEntry.findMany({ where: { financialYear: fy, category: 'expenditure' }, orderBy: { budgetHeadCode: 'asc' } }),
    db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const budgetRows = budgetEntries.map(b => ({
    code: b.budgetHeadCode,
    name: b.budgetHeadName || '',
    nameMr: b.budgetHeadNameMr || '',
    type: b.type,
    budget: b.revisedBudget || b.originalBudget,
    actual: b.actualAmount,
    pending: r2((b.revisedBudget || b.originalBudget) - b.actualAmount),
  }));

  const paymentRows = budgetEntries.length === 0 ? payments.map(p => ({
    code: p.headOfAccount || 'EXP',
    name: p.headOfAccountMr || p.headOfAccount || 'Expenditure',
    nameMr: p.headOfAccountMr || '',
    type: 'revenue',
    budget: 0,
    actual: p.amount,
    pending: 0,
  })) : [];

  const allRows = [...budgetRows, ...paymentRows];

  return {
    title: 'नमुना १७ - देताणी वही',
    titleEn: 'Namuna 17 - Liabilities Register',
    headers: ['खाते कोड', 'खाते नाव', 'प्रकार', 'अंदाज (₹)', 'वास्तव (₹)', 'बक्की (₹)'],
    rows: allRows,
    totals: {
      totalBudget: r2(allRows.reduce((s, r) => s + r.budget, 0)),
      totalActual: r2(allRows.reduce((s, r) => s + r.actual, 0)),
      totalPending: r2(allRows.reduce((s, r) => s + r.pending, 0)),
      totalLiabilities: r2(allRows.reduce((s, r) => s + r.actual, 0)),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 18 - आढावा मालमत्ता (Asset Verification Report)
// ============================================================
async function generateNamuna18(fy: string) {
  const [assets, village] = await Promise.all([
    db.assetEntry.findMany({ orderBy: { assetType: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const typeGroups = new Map<string, typeof assets>();
  for (const a of assets) {
    const key = a.assetType || 'Other';
    if (!typeGroups.has(key)) typeGroups.set(key, []);
    typeGroups.get(key)!.push(a);
  }

  const rows = Array.from(typeGroups.entries()).map(([type, items]) => ({
    assetType: type,
    count: items.length,
    totalPurchaseCost: r2(items.reduce((s, a) => s + a.purchaseCost, 0)),
    totalCurrentValue: r2(items.reduce((s, a) => s + a.currentValue, 0)),
    totalDepreciation: r2(items.reduce((s, a) => s + (a.purchaseCost - a.currentValue), 0)),
    activeCount: items.filter(a => a.status === 'Active').length,
    disposedCount: items.filter(a => a.status === 'Disposed').length,
  }));

  return {
    title: 'नमुना १८ - आढावा मालमत्ता',
    titleEn: 'Namuna 18 - Asset Verification Report',
    headers: ['मालमत्ता प्रकार', 'संख्या', 'एकूण खरेदी (₹)', 'एकूण चलन (₹)', 'एकूण घसारा (₹)', 'सक्रिय', 'विल्हेवाट'],
    rows,
    totals: {
      totalAssets: assets.length,
      totalPurchaseCost: r2(assets.reduce((s, a) => s + a.purchaseCost, 0)),
      totalCurrentValue: r2(assets.reduce((s, a) => s + a.currentValue, 0)),
      totalDepreciation: r2(assets.reduce((s, a) => s + (a.purchaseCost - a.currentValue), 0)),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 19 - कर वसूल वही (Tax Collection Register)
// ============================================================
async function generateNamuna19(fy: string) {
  const [collections, village] = await Promise.all([
    db.collectionEntry.findMany({ where: { financialYear: fy }, orderBy: { collectionDate: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const rows = collections.map(c => ({
    collectionNumber: c.collectionNumber,
    date: c.collectionDate,
    collectionType: c.collectionType || 'Other',
    amount: c.amount,
    paymentMethod: c.paymentMethod,
    receiptNumber: c.receiptNumber || '',
    description: c.description || '',
  }));

  const byType = new Map<string, { type: string; count: number; total: number }>();
  for (const c of collections) {
    const key = c.collectionType || 'Other';
    if (!byType.has(key)) byType.set(key, { type: key, count: 0, total: 0 });
    byType.get(key)!.count++;
    byType.get(key)!.total += c.amount;
  }

  return {
    title: 'नमुना १९ - कर वसूल वही',
    titleEn: 'Namuna 19 - Tax Collection Register',
    headers: ['वसूल क्र.', 'दिनांक', 'वसूल प्रकार', 'रक्कम (₹)', 'अर्ज पद्धत', 'पावती क्र.', 'विवरण'],
    rows,
    totals: {
      totalEntries: collections.length,
      totalCollected: r2(collections.reduce((s, c) => s + c.amount, 0)),
      byType: Array.from(byType.values()).map(v => ({ ...v, total: r2(v.total) })),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 20 - पाणीपट्टी वसूल वही (Water Tax Collection)
// ============================================================
async function generateNamuna20(fy: string) {
  const [waterBills, village] = await Promise.all([
    db.collectionEntry.findMany({ where: { financialYear: fy }, orderBy: { createdAt: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const rows = waterBills.map(w => ({
    billNumber: w.billNumber,
    createdAt: w.createdAt,
    amount: w.amount,
    penalty: w.penalty,
    totalAmount: w.totalAmount,
    paidAmount: w.paidAmount,
    paidDate: w.paidDate || '',
    status: w.status,
    balance: r2(w.totalAmount - w.paidAmount),
  }));

  return {
    title: 'नमुना २० - पाणीपट्टी वसूल वही',
    titleEn: 'Namuna 20 - Water Tax Collection Register',
    headers: ['बिल क्र.', 'बिल दिनांक', 'रक्कम (₹)', 'दंड (₹)', 'एकूण (₹)', 'भरलेले (₹)', 'भरल्याचा दिनांक', 'स्थिती', 'बक्की (₹)'],
    rows,
    totals: {
      totalBills: waterBills.length,
      totalAmount: r2(waterBills.reduce((s, w) => s + w.totalAmount, 0)),
      totalPaid: r2(waterBills.reduce((s, w) => s + w.paidAmount, 0)),
      totalBalance: r2(waterBills.reduce((s, w) => s + (w.totalAmount - w.paidAmount), 0)),
      pendingCount: waterBills.filter(w => w.status === 'Pending').length,
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 21 - वसूल तपासणी (Collection Verification)
// ============================================================
async function generateNamuna21(fy: string) {
  const [collections, namuna9s, village] = await Promise.all([
    db.collectionEntry.findMany({ where: { financialYear: fy } }),
    db.demandRegister.findMany({ where: { financialYear: fy }, include: { payments: true } }),
    db.villageInfo.findFirst(),
  ]);

  const totalCollection = collections.reduce((s, c) => s + c.amount, 0);
  const totalPayments = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);

  const rows = [
    { source: 'CollectionEntry', sourceMr: 'वसूल एंट्री', count: collections.length, total: r2(totalCollection) },
    { source: 'Payment (Namuna9)', sourceMr: 'पावती (नमुना ९)', count: namuna9s.reduce((s, n) => s + n.payments.length, 0), total: r2(totalPayments) },
    { source: 'Difference', sourceMr: 'फरक', count: 0, total: r2(totalCollection - totalPayments) },
  ];

  return {
    title: 'नमुना २१ - वसूल तपासणी',
    titleEn: 'Namuna 21 - Collection Verification Report',
    headers: ['स्रोत', 'एंट्री संख्या', 'एकूण रक्कम (₹)'],
    rows,
    totals: {
      totalCollection: r2(totalCollection),
      totalPayments: r2(totalPayments),
      difference: r2(totalCollection - totalPayments),
      isBalanced: Math.abs(totalCollection - totalPayments) < 0.01,
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 22 - देणेदार यादी (Debtors List)
// ============================================================
async function generateNamuna22(fy: string) {
  const [namuna9s, village] = await Promise.all([
    db.demandRegister.findMany({
      where: { financialYear: fy },
      include: { property: { include: { owners: { include: { owner: true } }, ward: true } }, payments: true },
    }),
    db.villageInfo.findFirst(),
  ]);

  const rows = namuna9s
    .map(n => {
      const totalPaid = n.payments.reduce((s, p) => s + p.amountPaid, 0);
      const balance = n.totalDemand - totalPaid;
      const primaryOwner = n.property.owners.find(o => o.ownershipType === 'मालक') || n.property.owners[0];
      return {
        propertyNumber: n.property.propertyNumber,
        ownerName: primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : '',
        mobileNumber: primaryOwner?.owner?.mobileNumber || '',
        wardName: n.property.ward?.wardNameMr || n.property.ward?.wardName || '',
        totalDemand: n.totalDemand,
        totalPaid: r2(totalPaid),
        outstanding: r2(balance),
      };
    })
    .filter(r => r.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  return {
    title: 'नमुना २२ - देणेदार यादी',
    titleEn: 'Namuna 22 - Debtors List',
    headers: ['मालमत्ता क्र.', 'मालक', 'मोबाईल', 'वार्ड', 'एकूण मागणी (₹)', 'वसूल (₹)', 'बक्की (₹)'],
    rows,
    totals: {
      totalDebtors: rows.length,
      totalOutstanding: r2(rows.reduce((s, r) => s + r.outstanding, 0)),
      totalDemand: r2(rows.reduce((s, r) => s + r.totalDemand, 0)),
      totalPaid: r2(rows.reduce((s, r) => s + r.totalPaid, 0)),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 23 - फाळवणार यादी (Creditors List)
// ============================================================
async function generateNamuna23(fy: string) {
  const [payments, village] = await Promise.all([
    db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } }),
    db.villageInfo.findFirst(),
  ]);

  const creditorMap = new Map<string, { name: string; totalAmount: number; count: number; lastPayment: string }>();
  for (const p of payments) {
    const key = p.paidTo || 'Unknown';
    if (!creditorMap.has(key)) creditorMap.set(key, { name: key, totalAmount: 0, count: 0, lastPayment: '' });
    const entry = creditorMap.get(key)!;
    entry.totalAmount += p.amount;
    entry.count++;
    if (p.paymentDate > entry.lastPayment) entry.lastPayment = p.paymentDate;
  }

  const rows = Array.from(creditorMap.entries())
    .map(([id, v]) => ({ id, ...v, totalAmount: r2(v.totalAmount) }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    title: 'नमुना २३ - फाळवणार यादी',
    titleEn: 'Namuna 23 - Creditors List',
    headers: ['क्रमांक', 'फाळवणाराचे नाव', 'एकूण रक्कम (₹)', 'अर्ज संख्या', 'शेवटचा अर्ज दिनांक'],
    rows,
    totals: {
      totalCreditors: rows.length,
      totalAmount: r2(rows.reduce((s, r) => s + r.totalAmount, 0)),
      totalPayments: payments.length,
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 24 - वसूल अहवाल (Collection Summary)
// ============================================================
async function generateNamuna24(fy: string) {
  const [collections, namuna9s, namuna8s, waterBills, village] = await Promise.all([
    db.collectionEntry.findMany({ where: { financialYear: fy } }),
    db.demandRegister.findMany({ where: { financialYear: fy }, include: { payments: true } }),
    db.taxAssessment.findMany({ where: { financialYear: fy } }),
    db.collectionEntry.findMany({ where: { financialYear: fy } }),
    db.villageInfo.findFirst(),
  ]);

  const totalTaxAssessed = namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0);
  const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
  const totalTaxPaid = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);
  const totalCollection = collections.reduce((s, c) => s + c.amount, 0);
  const totalWaterBilled = waterBills.reduce((s, w) => s + w.totalAmount, 0);
  const totalWaterPaid = waterBills.reduce((s, w) => s + w.paidAmount, 0);

  const rows = [
    { category: 'कर आकारणी', categoryEn: 'Tax Assessment', assessed: r2(totalTaxAssessed), collected: r2(totalTaxPaid), outstanding: r2(totalTaxAssessed - totalTaxPaid), efficiency: totalTaxAssessed > 0 ? r2((totalTaxPaid / totalTaxAssessed) * 100) : 0 },
    { category: 'मागणी नोंद', categoryEn: 'Demand Register', assessed: r2(totalDemand), collected: r2(totalTaxPaid), outstanding: r2(totalDemand - totalTaxPaid), efficiency: totalDemand > 0 ? r2((totalTaxPaid / totalDemand) * 100) : 0 },
    { category: 'वसूल एंट्री', categoryEn: 'Collection Entry', assessed: r2(totalCollection), collected: r2(totalCollection), outstanding: 0, efficiency: 100 },
    { category: 'पाणीपट्टी', categoryEn: 'Water Tax', assessed: r2(totalWaterBilled), collected: r2(totalWaterPaid), outstanding: r2(totalWaterBilled - totalWaterPaid), efficiency: totalWaterBilled > 0 ? r2((totalWaterPaid / totalWaterBilled) * 100) : 0 },
  ];

  return {
    title: 'नमुना २४ - वसूल अहवाल',
    titleEn: 'Namuna 24 - Collection Summary Report',
    headers: ['श्रेणी', 'आकारणी (₹)', 'वसूल (₹)', 'बक्की (₹)', 'वसूल क्षमता %'],
    rows,
    totals: {
      totalAssessed: r2(totalTaxAssessed + totalWaterBilled),
      totalCollected: r2(totalTaxPaid + totalWaterPaid),
      totalOutstanding: r2((totalTaxAssessed - totalTaxPaid) + (totalWaterBilled - totalWaterPaid)),
      overallEfficiency: (totalTaxAssessed + totalWaterBilled) > 0 ? r2(((totalTaxPaid + totalWaterPaid) / (totalTaxAssessed + totalWaterBilled)) * 100) : 0,
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 25 - हिशेब तपासणी (Audit Report)
// ============================================================
async function generateNamuna25(fy: string) {
  const [receipts, payments, journals, assets, stocks, namuna8s, namuna9s, collections, village] = await Promise.all([
    db.receiptEntry.findMany({ where: { financialYear: fy } }),
    db.paymentEntry.findMany({ where: { financialYear: fy } }),
    db.voucherEntry.findMany({ where: { financialYear: fy } }),
    db.assetEntry.findMany(),
    db.stockEntry.findMany(),
    db.taxAssessment.findMany({ where: { financialYear: fy } }),
    db.demandRegister.findMany({ where: { financialYear: fy }, include: { payments: true } }),
    db.collectionEntry.findMany({ where: { financialYear: fy } }),
    db.villageInfo.findFirst(),
  ]);

  const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
  const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);
  const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
  const totalPaid = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);

  const rows = [
    { item: 'एकूण प्राप्ती', itemEn: 'Total Receipts', count: receipts.length, amount: r2(totalIncome) },
    { item: 'एकूण अर्ज', itemEn: 'Total Payments', count: payments.length, amount: r2(totalExpenditure) },
    { item: 'जर्नल एंट्री', itemEn: 'Journal Entries', count: journals.length, amount: r2(journals.reduce((s, j) => s + j.amount, 0)) },
    { item: 'कर आकारणी', itemEn: 'Tax Assessment', count: namuna8s.length, amount: r2(namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0)) },
    { item: 'मागणी नोंद', itemEn: 'Demand Register', count: namuna9s.length, amount: r2(totalDemand) },
    { item: 'कर वसूल', itemEn: 'Tax Collection', count: namuna9s.reduce((s, n) => s + n.payments.length, 0), amount: r2(totalPaid) },
    { item: 'वसूल एंट्री', itemEn: 'Collection Entries', count: collections.length, amount: r2(collections.reduce((s, c) => s + c.amount, 0)) },
    { item: 'मालमत्ता', itemEn: 'Assets', count: assets.length, amount: r2(assets.reduce((s, a) => s + a.currentValue, 0)) },
    { item: 'साठा', itemEn: 'Stock', count: stocks.length, amount: r2(stocks.reduce((s, st) => s + st.totalValue, 0)) },
  ];

  const unpostedReceipts = receipts.filter(r => !r.isPosted).length;
  const unpostedPayments = payments.filter(p => !p.isPosted).length;
  const unpostedJournals = journals.filter(j => !j.isPosted).length;

  return {
    title: 'नमुना २५ - हिशेब तपासणी',
    titleEn: 'Namuna 25 - Audit Report',
    headers: ['मद', 'एंट्री संख्या', 'रक्कम (₹)'],
    rows,
    totals: {
      surplus: r2(totalIncome - totalExpenditure),
      collectionEfficiency: totalDemand > 0 ? r2((totalPaid / totalDemand) * 100) : 0,
      unpostedEntries: unpostedReceipts + unpostedPayments + unpostedJournals,
      auditStatus: (unpostedReceipts + unpostedPayments + unpostedJournals) > 0 ? 'Incomplete' : 'Complete',
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 26 - चौकशी अहवाल (Inquiry Summary)
// ============================================================
async function generateNamuna26(fy: string) {
  const [receipts, payments, namuna8s, namuna9s, village] = await Promise.all([
    db.receiptEntry.findMany({ where: { financialYear: fy } }),
    db.paymentEntry.findMany({ where: { financialYear: fy } }),
    db.taxAssessment.findMany({ where: { financialYear: fy } }),
    db.demandRegister.findMany({ where: { financialYear: fy }, include: { payments: true, property: { include: { owners: { include: { owner: true } } } } } }),
    db.villageInfo.findFirst(),
  ]);

  const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
  const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);
  const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
  const totalPaid = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);

  const rows = [
    { inquiry: 'एकूण प्राप्ती', value: r2(totalIncome), count: receipts.length },
    { inquiry: 'एकूण अर्ज', value: r2(totalExpenditure), count: payments.length },
    { inquiry: 'नफा/तोटा', value: r2(totalIncome - totalExpenditure), count: 0 },
    { inquiry: 'कर आकारणी', value: r2(namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0)), count: namuna8s.length },
    { inquiry: 'एकूण मागणी', value: r2(totalDemand), count: namuna9s.length },
    { inquiry: 'एकूण वसूल', value: r2(totalPaid), count: namuna9s.reduce((s, n) => s + n.payments.length, 0) },
    { inquiry: 'शिल्लक बक्की', value: r2(totalDemand - totalPaid), count: 0 },
    { inquiry: 'वसूल क्षमता %', value: totalDemand > 0 ? r2((totalPaid / totalDemand) * 100) : 0, count: 0 },
  ];

  return {
    title: 'नमुना २६ - चौकशी अहवाल',
    titleEn: 'Namuna 26 - Inquiry Summary',
    headers: ['चौकशी बाब', 'रक्कम (₹)', 'संख्या'],
    rows,
    totals: { totalIncome: r2(totalIncome), totalExpenditure: r2(totalExpenditure), surplus: r2(totalIncome - totalExpenditure) },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 27 - शेरा नोंद (Remarks/Observations)
// ============================================================
async function generateNamuna27(fy: string) {
  const [receipts, payments, namuna8s, namuna9s, village] = await Promise.all([
    db.receiptEntry.findMany({ where: { financialYear: fy } }),
    db.paymentEntry.findMany({ where: { financialYear: fy } }),
    db.taxAssessment.findMany({ where: { financialYear: fy } }),
    db.demandRegister.findMany({ where: { financialYear: fy }, include: { payments: true } }),
    db.villageInfo.findFirst(),
  ]);

  const remarks: { remark: string; remarkEn: string; severity: string; details: string }[] = [];

  const unpostedReceipts = receipts.filter(r => !r.isPosted).length;
  const unpostedPayments = payments.filter(p => !p.isPosted).length;

  if (unpostedReceipts > 0) remarks.push({ remark: 'अपोस्ट केलेल्या प्राप्ती', remarkEn: 'Unposted Receipts', severity: 'Warning', details: `${unpostedReceipts} receipts not posted` });
  if (unpostedPayments > 0) remarks.push({ remark: 'अपोस्ट केलेल्या अर्ज', remarkEn: 'Unposted Payments', severity: 'Warning', details: `${unpostedPayments} payments not posted` });

  const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
  const totalPaid = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);
  const efficiency = totalDemand > 0 ? (totalPaid / totalDemand) * 100 : 0;

  if (efficiency < 50 && totalDemand > 0) remarks.push({ remark: 'कमी वसूल क्षमता', remarkEn: 'Low Collection Efficiency', severity: 'Critical', details: `${r2(efficiency)}%, below 50%` });
  else if (efficiency < 80 && totalDemand > 0) remarks.push({ remark: 'मध्यम वसूल क्षमता', remarkEn: 'Moderate Collection Efficiency', severity: 'Warning', details: `${r2(efficiency)}%, below 80%` });

  if (namuna8s.length === 0) remarks.push({ remark: 'कर आकारणी नाही', remarkEn: 'No Tax Assessment', severity: 'Critical', details: 'No Namuna 8 entries' });
  if (namuna9s.length === 0) remarks.push({ remark: 'मागणी नोंद नाही', remarkEn: 'No Demand Register', severity: 'Critical', details: 'No Namuna 9 entries' });

  if (remarks.length === 0) remarks.push({ remark: 'सर्व ठीक आहे', remarkEn: 'All Clear', severity: 'Info', details: 'No issues found' });

  return {
    title: 'नमुना २७ - शेरा नोंद',
    titleEn: 'Namuna 27 - Remarks/Observations',
    headers: ['शेरा', 'शेरा (English)', 'गंभीरता', 'तपशील'],
    rows: remarks,
    totals: {
      totalRemarks: remarks.length,
      criticalCount: remarks.filter(r => r.severity === 'Critical').length,
      warningCount: remarks.filter(r => r.severity === 'Warning').length,
      infoCount: remarks.filter(r => r.severity === 'Info').length,
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 28 - योजना निधी वही (Scheme Fund Register)
// ============================================================
async function generateNamuna28(fy: string) {
  const [schemeFunds, schemes, village] = await Promise.all([
    db.schemeFundEntry.findMany({ where: { financialYear: fy }, orderBy: { entryDate: 'asc' } }),
    db.schemeInfo.findMany({ where: { isActive: true } }),
    db.villageInfo.findFirst(),
  ]);

  const schemeMap = new Map(schemes.map(s => [s.id, s]));

  const rows = schemeFunds.map(sf => ({
    voucherNumber: sf.voucherNumber,
    date: sf.entryDate,
    schemeName: sf.schemeId ? schemeMap.get(sf.schemeId)?.schemeName || '' : '',
    schemeNameMr: sf.schemeId ? schemeMap.get(sf.schemeId)?.schemeNameMr || '' : '',
    schemeType: sf.schemeId ? schemeMap.get(sf.schemeId)?.schemeType || '' : '',
    entryType: sf.entryType,
    entryTypeMr: sf.entryType === 'Receipt' ? 'प्राप्ती' : 'अर्ज',
    amount: sf.amount,
    description: sf.description || '',
  }));

  const schemeSummary = new Map<string, { name: string; nameMr: string; type: string; allocation: number; receipts: number; payments: number; balance: number }>();
  for (const s of schemes) {
    schemeSummary.set(s.id, { name: s.schemeName, nameMr: s.schemeNameMr || '', type: s.schemeType || '', allocation: s.totalAllocation, receipts: 0, payments: 0, balance: 0 });
  }
  for (const sf of schemeFunds) {
    const key = sf.schemeId || 'none';
    if (!schemeSummary.has(key)) schemeSummary.set(key, { name: 'Unassigned', nameMr: '', type: '', allocation: 0, receipts: 0, payments: 0, balance: 0 });
    const entry = schemeSummary.get(key)!;
    if (sf.entryType === 'Receipt') entry.receipts += sf.amount;
    else entry.payments += sf.amount;
    entry.balance = r2(entry.receipts - entry.payments);
  }

  const totalReceipts = schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((s, sf) => s + sf.amount, 0);
  const totalPayments = schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((s, sf) => s + sf.amount, 0);

  return {
    title: 'नमुना २८ - योजना निधी वही',
    titleEn: 'Namuna 28 - Scheme Fund Register',
    headers: ['वाउचर क्र.', 'दिनांक', 'योजना', 'प्रकार', 'रक्कम (₹)', 'विवरण'],
    rows,
    schemeSummary: Array.from(schemeSummary.entries()).map(([id, v]) => ({ id, ...v })),
    totals: {
      totalEntries: schemeFunds.length,
      totalReceipts: r2(totalReceipts),
      totalPayments: r2(totalPayments),
      balance: r2(totalReceipts - totalPayments),
      totalSchemes: schemes.length,
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 29 - योजना कामे वही (Scheme Works Register)
// ============================================================
async function generateNamuna29(fy: string) {
  const [works, schemes, contractors, village] = await Promise.all([
    db.workEntry.findMany({ where: { financialYear: fy }, orderBy: { workNumber: 'asc' } }),
    db.schemeInfo.findMany(),
    db.contractorMaster.findMany(),
    db.villageInfo.findFirst(),
  ]);

  const schemeMap = new Map(schemes.map(s => [s.id, s]));
  const contractorMap = new Map(contractors.map(c => [c.id, c]));

  const rows = works.map(w => ({
    workNumber: w.workNumber,
    workName: w.workName,
    workNameMr: w.workNameMr,
    schemeName: w.schemeId ? schemeMap.get(w.schemeId)?.schemeName || '' : '',
    contractorName: w.contractorId ? (contractorMap.get(w.contractorId)?.firmName || `${contractorMap.get(w.contractorId)?.firstName || ''} ${contractorMap.get(w.contractorId)?.lastName || ''}`) : '',
    workType: w.workType || '',
    sanctionDate: w.sanctionDate || '',
    sanctionAmount: w.sanctionAmount,
    progressPercent: w.progressPercent,
    totalExpenditure: w.totalExpenditure,
    status: w.status,
  }));

  return {
    title: 'नमुना २९ - योजना कामे वही',
    titleEn: 'Namuna 29 - Scheme Works Register',
    headers: ['काम क्र.', 'कामाचे नाव', 'योजना', 'कंत्राटदार', 'काम प्रकार', 'स्वीकृती दिनांक', 'स्वीकृत रक्कम (₹)', 'प्रगती %', 'एकूण खर्च (₹)', 'स्थिती'],
    rows,
    totals: {
      totalWorks: works.length,
      totalSanctionAmount: r2(works.reduce((s, w) => s + w.sanctionAmount, 0)),
      totalExpenditure: r2(works.reduce((s, w) => s + w.totalExpenditure, 0)),
      avgProgress: works.length > 0 ? r2(works.reduce((s, w) => s + w.progressPercent, 0) / works.length) : 0,
      byStatus: groupBy(works, 'status'),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 30 - योजना अहवाल (Scheme Completion Report)
// ============================================================
async function generateNamuna30(fy: string) {
  const [works, schemes, village] = await Promise.all([
    db.workEntry.findMany({ where: { financialYear: fy } }),
    db.schemeInfo.findMany(),
    db.villageInfo.findFirst(),
  ]);

  const schemeMap = new Map(schemes.map(s => [s.id, s]));

  const byScheme = new Map<string, { schemeName: string; works: typeof works; totalSanction: number; totalExpenditure: number; completedCount: number }>();
  for (const w of works) {
    const key = w.schemeId || 'none';
    const scheme = w.schemeId ? schemeMap.get(w.schemeId) : null;
    if (!byScheme.has(key)) byScheme.set(key, { schemeName: scheme?.schemeName || 'Unassigned', works: [], totalSanction: 0, totalExpenditure: 0, completedCount: 0 });
    const entry = byScheme.get(key)!;
    entry.works.push(w);
    entry.totalSanction += w.sanctionAmount;
    entry.totalExpenditure += w.totalExpenditure;
    if (w.status === 'Completed') entry.completedCount++;
  }

  const rows = Array.from(byScheme.entries()).map(([id, v]) => ({
    id,
    schemeName: v.schemeName,
    totalWorks: v.works.length,
    completedWorks: v.completedCount,
    totalSanction: r2(v.totalSanction),
    totalExpenditure: r2(v.totalExpenditure),
    completionRate: v.works.length > 0 ? r2((v.completedCount / v.works.length) * 100) : 0,
    utilizationRate: v.totalSanction > 0 ? r2((v.totalExpenditure / v.totalSanction) * 100) : 0,
  }));

  return {
    title: 'नमुना ३० - योजना अहवाल',
    titleEn: 'Namuna 30 - Scheme Completion Report',
    headers: ['योजना', 'एकूण कामे', 'पूर्ण कामे', 'स्वीकृत रक्कम (₹)', 'एकूण खर्च (₹)', 'पूर्णता दर %', 'वापर दर %'],
    rows,
    totals: {
      totalSchemes: rows.length,
      totalWorks: works.length,
      totalCompleted: works.filter(w => w.status === 'Completed').length,
      totalSanction: r2(works.reduce((s, w) => s + w.sanctionAmount, 0)),
      totalExpenditure: r2(works.reduce((s, w) => s + w.totalExpenditure, 0)),
    },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 31 - उत्पन्न व खर्च खाते (Income & Expenditure Account)
// ============================================================
async function generateNamuna31(fy: string) {
  const [receipts, payments, journals, ledgerEntries, village] = await Promise.all([
    db.receiptEntry.findMany({ where: { financialYear: fy } }),
    db.paymentEntry.findMany({ where: { financialYear: fy } }),
    db.voucherEntry.findMany({ where: { financialYear: fy } }),
    db.ledgerEntry.findMany({ where: { financialYear: fy } }),
    db.villageInfo.findFirst(),
  ]);

  let incomeByHead: { key: string; total: number }[];
  let expenditureByHead: { key: string; total: number }[];

  if (ledgerEntries.length > 0) {
    const incomeMap = new Map<string, number>();
    const expenditureMap = new Map<string, number>();
    for (const le of ledgerEntries) {
      if (le.creditAmount > 0) incomeMap.set(le.accountName || le.accountCode, (incomeMap.get(le.accountName || le.accountCode) || 0) + le.creditAmount);
      if (le.debitAmount > 0) expenditureMap.set(le.accountName || le.accountCode, (expenditureMap.get(le.accountName || le.accountCode) || 0) + le.debitAmount);
    }
    incomeByHead = Array.from(incomeMap.entries()).map(([key, total]) => ({ key, total: r2(total) }));
    expenditureByHead = Array.from(expenditureMap.entries()).map(([key, total]) => ({ key, total: r2(total) }));
  } else {
    incomeByHead = groupAndSum(receipts, 'headOfAccount', 'amount');
    expenditureByHead = groupAndSum(payments, 'headOfAccount', 'amount');
  }

  const totalIncome = r2(incomeByHead.reduce((s, i) => s + i.total, 0));
  const totalExpenditure = r2(expenditureByHead.reduce((s, e) => s + e.total, 0));

  return {
    title: 'नमुना ३१ - उत्पन्न व खर्च खाते',
    titleEn: 'Namuna 31 - Income & Expenditure Account',
    incomeHeaders: ['उत्पन्न शीर्ष', 'रक्कम (₹)'],
    expenditureHeaders: ['खर्च शीर्ष', 'रक्कम (₹)'],
    incomeRows: incomeByHead,
    expenditureRows: expenditureByHead,
    totals: {
      totalIncome,
      totalExpenditure,
      surplus: r2(totalIncome - totalExpenditure),
      deficit: totalExpenditure > totalIncome ? r2(totalExpenditure - totalIncome) : 0,
    },
    meta: { village, financialYear: fy, source: ledgerEntries.length > 0 ? 'ledger' : 'transactions' },
  };
}

// ============================================================
// NAMUNA 32 - मालमत्ता व देणेदारीपत्र (Balance Sheet)
// ============================================================
async function generateNamuna32(fy: string) {
  const [receipts, payments, assets, bankAccounts, schemeFunds, village] = await Promise.all([
    db.receiptEntry.findMany({ where: { financialYear: fy } }),
    db.paymentEntry.findMany({ where: { financialYear: fy } }),
    db.assetEntry.findMany(),
    db.bankAccount.findMany({ where: { isActive: true } }),
    db.schemeFundEntry.findMany({ where: { financialYear: fy } }),
    db.villageInfo.findFirst(),
  ]);

  const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
  const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);
  const totalAssetValue = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalDepreciation = assets.reduce((s, a) => s + (a.purchaseCost - a.currentValue), 0);
  const totalBankBalance = bankAccounts.reduce((s, b) => s + b.balance, 0);
  const cashBalance = r2(totalIncome - totalExpenditure);
  const schemeBalance = schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((s, sf) => s + sf.amount, 0) - schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((s, sf) => s + sf.amount, 0);
  const surplus = r2(totalIncome - totalExpenditure);

  const assetRows = [
    { category: 'स्थावर मालमत्ता', categoryEn: 'Fixed Assets', amount: r2(totalAssetValue) },
    { category: 'घसारा', categoryEn: 'Depreciation', amount: r2(-totalDepreciation) },
    { category: 'बँक शिल्लक', categoryEn: 'Bank Balance', amount: r2(totalBankBalance) },
    { category: 'रोकड शिल्लक', categoryEn: 'Cash Balance', amount: cashBalance },
  ];

  const liabilityRows = [
    { category: 'योजना निधी शिल्लक', categoryEn: 'Scheme Fund Balance', amount: r2(schemeBalance) },
    { category: 'नफा / गाठ', categoryEn: 'Surplus / Reserve', amount: surplus },
  ];

  const totalAssets = r2(totalAssetValue + totalBankBalance + cashBalance);
  const totalLiabilities = r2(schemeBalance + surplus);

  return {
    title: 'नमुना ३२ - मालमत्ता व देणेदारीपत्र',
    titleEn: 'Namuna 32 - Balance Sheet',
    assetHeaders: ['मालमत्ता', 'रक्कम (₹)'],
    liabilityHeaders: ['देणेदारी', 'रक्कम (₹)'],
    assetRows,
    liabilityRows,
    totals: { totalAssets, totalLiabilities, difference: r2(totalAssets - totalLiabilities), isBalanced: Math.abs(totalAssets - totalLiabilities) < 0.01 },
    meta: { village, financialYear: fy },
  };
}

// ============================================================
// NAMUNA 33 - वित्तीय अहवाल (Financial Summary)
// ============================================================
async function generateNamuna33(fy: string) {
  const [receipts, payments, journals, assets, stocks, bankAccounts, schemeFunds, namuna8s, namuna9s, collections, waterBills, works, village] = await Promise.all([
    db.receiptEntry.findMany({ where: { financialYear: fy } }),
    db.paymentEntry.findMany({ where: { financialYear: fy } }),
    db.voucherEntry.findMany({ where: { financialYear: fy } }),
    db.assetEntry.findMany(),
    db.stockEntry.findMany(),
    db.bankAccount.findMany({ where: { isActive: true } }),
    db.schemeFundEntry.findMany({ where: { financialYear: fy } }),
    db.taxAssessment.findMany({ where: { financialYear: fy } }),
    db.demandRegister.findMany({ where: { financialYear: fy }, include: { payments: true } }),
    db.collectionEntry.findMany({ where: { financialYear: fy } }),
    db.collectionEntry.findMany({ where: { financialYear: fy } }),
    db.workEntry.findMany({ where: { financialYear: fy } }),
    db.villageInfo.findFirst(),
  ]);

  const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
  const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);
  const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
  const totalPaid = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);
  const totalTaxAssessed = namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0);
  const totalAssetValue = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalBankBalance = bankAccounts.reduce((s, b) => s + b.balance, 0);
  const totalSchemeReceipts = schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((s, sf) => s + sf.amount, 0);
  const totalSchemePayments = schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((s, sf) => s + sf.amount, 0);
  const totalWaterBilled = waterBills.reduce((s, w) => s + w.totalAmount, 0);
  const totalWaterPaid = waterBills.reduce((s, w) => s + w.paidAmount, 0);
  const totalCollections = collections.reduce((s, c) => s + c.amount, 0);

  return {
    title: 'नमुना ३३ - वित्तीय अहवाल',
    titleEn: 'Namuna 33 - Financial Summary',
    receiptAndPayment: {
      totalReceipts: r2(totalIncome), totalPayments: r2(totalExpenditure),
      surplus: r2(totalIncome - totalExpenditure),
      receiptCount: receipts.length, paymentCount: payments.length, journalCount: journals.length,
    },
    taxCollection: {
      totalAssessed: r2(totalTaxAssessed), totalDemand: r2(totalDemand),
      totalCollected: r2(totalPaid), totalOutstanding: r2(totalDemand - totalPaid),
      collectionEfficiency: totalDemand > 0 ? r2((totalPaid / totalDemand) * 100) : 0,
      totalCollections: r2(totalCollections),
    },
    waterTax: {
      totalBilled: r2(totalWaterBilled), totalPaid: r2(totalWaterPaid),
      totalOutstanding: r2(totalWaterBilled - totalWaterPaid),
      pendingBills: waterBills.filter(w => w.status === 'Pending').length,
    },
    assetsAndStock: {
      totalAssetValue: r2(totalAssetValue), totalAssetCount: assets.length,
      totalDepreciation: r2(assets.reduce((s, a) => s + (a.purchaseCost - a.currentValue), 0)),
      totalStockValue: r2(stocks.reduce((s, st) => s + st.totalValue, 0)), totalStockItems: stocks.length,
      totalBankBalance: r2(totalBankBalance), bankCount: bankAccounts.length,
    },
    schemeAndWorks: {
      totalSchemeReceipts: r2(totalSchemeReceipts), totalSchemePayments: r2(totalSchemePayments),
      schemeBalance: r2(totalSchemeReceipts - totalSchemePayments),
      totalWorks: works.length, completedWorks: works.filter(w => w.status === 'Completed').length,
      totalSanctionAmount: r2(works.reduce((s, w) => s + w.sanctionAmount, 0)),
      totalWorkExpenditure: r2(works.reduce((s, w) => s + w.totalExpenditure, 0)),
    },
    balanceSheet: {
      totalAssets: r2(totalAssetValue + totalBankBalance + (totalIncome - totalExpenditure)),
      totalLiabilities: r2(totalSchemeReceipts - totalSchemePayments + (totalIncome - totalExpenditure)),
    },
    meta: { village, financialYear: fy, generatedAt: new Date().toISOString() },
  };
}

// ============================================================
// SUMMARY ENDPOINT - When namuna=all
// ============================================================
async function generateSummary(fy: string) {
  const budgetCount = await db.budgetEntry.count({ where: { financialYear: fy } });
  const receiptCount = await db.receiptEntry.count({ where: { financialYear: fy } });
  const paymentCount = await db.paymentEntry.count({ where: { financialYear: fy } });
  const journalCount = await db.voucherEntry.count({ where: { financialYear: fy } });
  const assetCount = await db.assetEntry.count();
  const stockCount = await db.stockEntry.count();
  const schemeFundCount = await db.schemeFundEntry.count({ where: { financialYear: fy } });
  const namuna8Count = await db.taxAssessment.count({ where: { financialYear: fy } });
  const namuna9Count = await db.demandRegister.count({ where: { financialYear: fy } });
  const paymentCount2 = await db.taxPayment.count();
  const collectionCount = await db.collectionEntry.count({ where: { financialYear: fy } });
  const waterBillCount = await db.collectionEntry.count({ where: { financialYear: fy } });
  const workCount = await db.workEntry.count({ where: { financialYear: fy } });
  const ledgerCount = await db.ledgerEntry.count({ where: { financialYear: fy } });
  const bankCount = await db.bankAccount.count({ where: { isActive: true } });
  const salaryCount = await db.salaryEntry.count({ where: { financialYear: fy } });

  const namunaDefinitions = [
    { namuna: 1, title: 'अंदाजपत्रक मालमत्ता पत्र', titleEn: 'Budget Assets Sheet', source: 'BudgetEntry', count: budgetCount },
    { namuna: 2, title: 'अंदाजपत्रक उत्पन्न व खर्च', titleEn: 'Budget Income vs Expenditure', source: 'BudgetEntry', count: budgetCount },
    { namuna: 3, title: 'रोकड वही', titleEn: 'Cash Book', source: 'ReceiptEntry+PaymentEntry', count: receiptCount + paymentCount },
    { namuna: 4, title: 'बँक वही', titleEn: 'Bank Book', source: 'ReceiptEntry+PaymentEntry(Bank)', count: receiptCount + paymentCount },
    { namuna: 5, title: 'मालमत्ता रजिस्टर', titleEn: 'Asset Register', source: 'AssetEntry', count: assetCount },
    { namuna: 6, title: 'साठा रजिस्टर', titleEn: 'Stock Register', source: 'StockEntry', count: stockCount },
    { namuna: 7, title: 'अनुदान नोंदवही', titleEn: 'Grant Register', source: 'SchemeFundEntry', count: schemeFundCount },
    { namuna: 8, title: 'कर आकारणी', titleEn: 'Tax Assessment', source: 'Namuna8', count: namuna8Count },
    { namuna: 9, title: 'मागणी नोंदवही', titleEn: 'Demand Register', source: 'Namuna9', count: namuna9Count },
    { namuna: 10, title: 'थकबाकी/DCB', titleEn: 'Demand Collection Balance', source: 'Namuna9+Payment', count: namuna9Count + paymentCount2 },
    { namuna: 11, title: 'दैनंदिन रोकड वही', titleEn: 'Daily Cash Summary', source: 'ReceiptEntry+PaymentEntry', count: receiptCount + paymentCount },
    { namuna: 12, title: 'जमा खाते रजिस्टर', titleEn: 'Credit Account Register', source: 'LedgerEntry+ReceiptEntry', count: Math.max(ledgerCount, receiptCount) },
    { namuna: 13, title: 'नामे खाते रजिस्टर', titleEn: 'Debit Account Register', source: 'LedgerEntry+PaymentEntry', count: Math.max(ledgerCount, paymentCount) },
    { namuna: 14, title: 'खाते खत', titleEn: 'Ledger', source: 'LedgerEntry+Transactions', count: Math.max(ledgerCount, receiptCount + paymentCount + journalCount) },
    { namuna: 15, title: 'तपासणी पत्र', titleEn: 'Trial Balance', source: 'LedgerEntry+Transactions', count: Math.max(ledgerCount, receiptCount + paymentCount) },
    { namuna: 16, title: 'मालमत्ता वही', titleEn: 'Asset Verification', source: 'AssetEntry', count: assetCount },
    { namuna: 17, title: 'देताणी वही', titleEn: 'Liabilities Register', source: 'BudgetEntry+PaymentEntry', count: budgetCount + paymentCount },
    { namuna: 18, title: 'आढावा मालमत्ता', titleEn: 'Asset Verification Report', source: 'AssetEntry', count: assetCount },
    { namuna: 19, title: 'कर वसूल वही', titleEn: 'Tax Collection Register', source: 'CollectionEntry', count: collectionCount },
    { namuna: 20, title: 'पाणीपट्टी वसूल वही', titleEn: 'Water Tax Collection', source: 'WaterBillEntry', count: waterBillCount },
    { namuna: 21, title: 'वसूल तपासणी', titleEn: 'Collection Verification', source: 'CollectionEntry+Payment', count: collectionCount + paymentCount2 },
    { namuna: 22, title: 'देणेदार यादी', titleEn: 'Debtors List', source: 'Namuna9+Payment', count: namuna9Count },
    { namuna: 23, title: 'फाळवणार यादी', titleEn: 'Creditors List', source: 'PaymentEntry', count: paymentCount },
    { namuna: 24, title: 'वसूल अहवाल', titleEn: 'Collection Summary', source: 'Multiple', count: collectionCount + namuna8Count + namuna9Count + waterBillCount },
    { namuna: 25, title: 'हिशेब तपासणी', titleEn: 'Audit Report', source: 'All Entries', count: receiptCount + paymentCount + journalCount + assetCount + namuna8Count + namuna9Count + collectionCount },
    { namuna: 26, title: 'चौकशी अहवाल', titleEn: 'Inquiry Summary', source: 'All Entries', count: receiptCount + paymentCount + namuna8Count + namuna9Count },
    { namuna: 27, title: 'शेरा नोंद', titleEn: 'Remarks/Observations', source: 'All Entries', count: receiptCount + paymentCount + namuna8Count + namuna9Count },
    { namuna: 28, title: 'योजना निधी वही', titleEn: 'Scheme Fund Register', source: 'SchemeFundEntry+SchemeInfo', count: schemeFundCount },
    { namuna: 29, title: 'योजना कामे वही', titleEn: 'Scheme Works Register', source: 'WorkEntry', count: workCount },
    { namuna: 30, title: 'योजना अहवाल', titleEn: 'Scheme Completion Report', source: 'WorkEntry+SchemeInfo', count: workCount },
    { namuna: 31, title: 'उत्पन्न व खर्च खाते', titleEn: 'Income & Expenditure Account', source: 'LedgerEntry+Transactions', count: Math.max(ledgerCount, receiptCount + paymentCount) },
    { namuna: 32, title: 'मालमत्ता व देणेदारीपत्र', titleEn: 'Balance Sheet', source: 'All Data', count: assetCount + bankCount + receiptCount + paymentCount + schemeFundCount },
    { namuna: 33, title: 'वित्तीय अहवाल', titleEn: 'Financial Summary', source: 'All Data', count: receiptCount + paymentCount + assetCount + namuna8Count + namuna9Count + collectionCount + waterBillCount + workCount },
  ];

  const summary = namunaDefinitions.map(n => ({
    ...n,
    status: n.count > 0 ? (n.count >= 5 ? 'available' as const : 'partial' as const) : 'none' as const,
  }));

  return NextResponse.json({
    title: 'नमुना १-३३ सारांश',
    titleEn: 'Namuna 1-33 Summary',
    financialYear: fy,
    namunas: summary,
    totalAvailable: summary.filter(n => n.status === 'available').length,
    totalPartial: summary.filter(n => n.status === 'partial').length,
    totalNone: summary.filter(n => n.status === 'none').length,
    dataCounts: {
      budgetEntries: budgetCount,
      receiptEntries: receiptCount,
      paymentEntries: paymentCount,
      journalEntries: journalCount,
      assetEntries: assetCount,
      stockEntries: stockCount,
      schemeFundEntries: schemeFundCount,
      namuna8Entries: namuna8Count,
      namuna9Entries: namuna9Count,
      payments: paymentCount2,
      collectionEntries: collectionCount,
      waterBillEntries: waterBillCount,
      workEntries: workCount,
      ledgerEntries: ledgerCount,
      bankAccounts: bankCount,
      salaryEntries: salaryCount,
    },
  });
}
