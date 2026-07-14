import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ─── Helpers ────────────────────────────────────────────────────────────────

const r2 = (n: number) => Math.round(n * 100) / 100;

function groupByField<T>(arr: T[], key: keyof T): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of arr) {
    const k = String(item[key] ?? 'Other');
    result[k] = (result[k] || 0) + 1;
  }
  return result;
}

function sumField<T>(arr: T[], key: keyof T): number {
  return arr.reduce((s, item) => s + Number(item[key] ?? 0), 0);
}

/** Safely query the database; returns [] on error */
async function safeQuery<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

/** Safely query a single record; returns null on error */
async function safeQueryOne<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

// PropertyMaster standard include
const PROPERTY_INCLUDE = {
  ward: true,
  road: true,
  owner: true,
  owners: { include: { owner: true } },
  taxRates: { include: { taxMaster: true } },
} as const;

// ─── GET Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const namunaParam = searchParams.get('namuna');
  const financialYear = searchParams.get('financialYear') || '2024-25';

  if (!namunaParam) {
    return NextResponse.json({ error: 'Namuna number required (1-33)' }, { status: 400 });
  }

  // Handle sub-forms like "5ka", "9ka", "20ka", "20kha", "26ka", "26kha"
  let namunaNum: number;
  const nk = namunaParam.trim().toLowerCase();
  if (nk === '5ka') namunaNum = 5.1;
  else if (nk === '9ka') namunaNum = 9.1;
  else if (nk === '20ka') namunaNum = 20.1;
  else if (nk === '20kha') namunaNum = 20.2;
  else if (nk === '26ka') namunaNum = 26.1;
  else if (nk === '26kha') namunaNum = 26.2;
  else namunaNum = parseFloat(namunaParam);

  if (isNaN(namunaNum) || namunaNum < 1 || namunaNum > 33) {
    return NextResponse.json({ error: 'Invalid Namuna number. Must be 1-33' }, { status: 400 });
  }

  try {
    const village = await safeQueryOne(() => db.villageInfo.findFirst());
    const fy = financialYear;

    let data;
    switch (namunaNum) {
      case 1: data = await generateNamuna1(fy, village); break;
      case 2: data = await generateNamuna2(fy, village); break;
      case 3: data = await generateNamuna3(fy, village); break;
      case 4: data = await generateNamuna4(fy, village); break;
      case 5: data = await generateNamuna5(fy, village); break;
      case 5.1: data = await generateNamuna5ka(fy, village); break;
      case 6: data = await generateNamuna6(fy, village); break;
      case 7: data = await generateNamuna7(fy, village); break;
      case 8: data = await generateNamuna8(fy, village); break;
      case 9: data = await generateNamuna9(fy, village); break;
      case 9.1: data = await generateNamuna9ka(fy, village); break;
      case 10: data = await generateNamuna10(fy, village); break;
      case 11: data = await generateNamuna11(fy, village); break;
      case 12: data = await generateNamuna12(fy, village); break;
      case 13: data = await generateNamuna13(fy, village); break;
      case 14: data = await generateNamuna14(fy, village); break;
      case 15: data = await generateNamuna15(fy, village); break;
      case 16: data = await generateNamuna16(fy, village); break;
      case 17: data = await generateNamuna17(fy, village); break;
      case 18: data = await generateNamuna18(fy, village); break;
      case 19: data = await generateNamuna19(fy, village); break;
      case 20: data = await generateNamuna20(fy, village); break;
      case 20.1: data = await generateNamuna20ka(fy, village); break;
      case 20.2: data = await generateNamuna20kha(fy, village); break;
      case 21: data = await generateNamuna21(fy, village); break;
      case 22: data = await generateNamuna22(fy, village); break;
      case 23: data = await generateNamuna23(fy, village); break;
      case 24: data = await generateNamuna24(fy, village); break;
      case 25: data = await generateNamuna25(fy, village); break;
      case 26.1: data = await generateNamuna26ka(fy, village); break;
      case 26.2: data = await generateNamuna26kha(fy, village); break;
      case 27: data = await generateNamuna27(fy, village); break;
      case 28: data = await generateNamuna28(fy, village); break;
      case 29: data = await generateNamuna29(fy, village); break;
      case 30: data = await generateNamuna30(fy, village); break;
      case 31: data = await generateNamuna31(fy, village); break;
      case 32: data = await generateNamuna32(fy, village); break;
      case 33: data = await generateNamuna33(fy, village); break;
      default:
        return NextResponse.json({ error: 'Invalid namuna number' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Namuna-reports error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// ─── NAMUNA HELPERS ─────────────────────────────────────────────────────────

interface VillageInfoType {
  id: string;
  gramPanchayatName: string;
  gramPanchayatNameMr: string;
  taluka: string;
  district: string;
  state: string;
  pinCode: string | null;
  population: number | null;
  totalArea: number | null;
  gramSabhaDate: string | null;
  sarpanchName: string | null;
  sarpanchNameMr: string | null;
  secretaryName: string | null;
  secretaryNameMr: string | null;
  financialYear: string;
  createdAt: Date;
  updatedAt: Date;
}

function makeBase(namuna: number, title: string, titleEn: string, fy: string, village: VillageInfoType | null) {
  return {
    namuna,
    title,
    titleEn,
    village: village ? {
      gramPanchayatName: village.gramPanchayatName,
      gramPanchayatNameMr: village.gramPanchayatNameMr,
      taluka: village.taluka,
      district: village.district,
      state: village.state,
      sarpanchNameMr: village.sarpanchNameMr,
      secretaryNameMr: village.secretaryNameMr,
    } : null,
    financialYear: fy,
  };
}

// ============================================================
// NAMUNA 1 - अर्थसंकल्प/अंदाजपत्रक (Budget Estimate)
// Budget data grouped by income/expenditure heads
// ============================================================
async function generateNamuna1(fy: string, village: VillageInfoType | null) {
  const budgetEntries = await safeQuery(() =>
    db.budgetEntry.findMany({ where: { financialYear: fy }, orderBy: { budgetHeadCode: 'asc' } })
  );
  const budgetHeads = await safeQuery(() => db.budgetHead.findMany());

  const headMap = new Map(budgetHeads.map(h => [h.id, h]));

  const incomeEntries = budgetEntries.filter(b => b.category === 'income');
  const expenditureEntries = budgetEntries.filter(b => b.category === 'expenditure');

  const rows = budgetEntries.map((b, i) => ({
    _sr: i + 1,
    code: b.budgetHeadCode || '',
    name: b.budgetHeadName || headMap.get(b.headId)?.headName || '',
    nameMr: b.budgetHeadNameMr || headMap.get(b.headId)?.headNameMr || '',
    category: b.category === 'income' ? 'उत्पन्न' : 'खर्च',
    type: b.type || '',
    originalBudget: b.originalBudget,
    revisedBudget: b.revisedBudget,
    actualAmount: b.actualAmount,
    variance: r2((b.revisedBudget || b.originalBudget) - b.actualAmount),
  }));

  return {
    ...makeBase(1, 'नमुना १ - अर्थसंकल्प/अंदाजपत्रक', 'Namuna 1 - Budget Estimate', fy, village),
    headers: ['अ.क्र.', 'खाते कोड', 'खाते नाव', 'श्रेणी', 'प्रकार', 'मूळ अंदाज (₹)', 'दुरुस्तीत अंदाज (₹)', 'वास्तव रक्कम (₹)', 'फरक (₹)'],
    rows,
    totals: {
      totalOriginalBudget: r2(budgetEntries.reduce((s, b) => s + b.originalBudget, 0)),
      totalRevisedBudget: r2(budgetEntries.reduce((s, b) => s + b.revisedBudget, 0)),
      totalActualAmount: r2(budgetEntries.reduce((s, b) => s + b.actualAmount, 0)),
      incomeOriginal: r2(incomeEntries.reduce((s, b) => s + b.originalBudget, 0)),
      expenditureOriginal: r2(expenditureEntries.reduce((s, b) => s + b.originalBudget, 0)),
    },
    meta: { financialYear: fy, totalEntries: budgetEntries.length },
  };
}

// ============================================================
// NAMUNA 2 - पुनर्विनियोजन व नियत वाटप (Re-appropriation)
// ============================================================
async function generateNamuna2(fy: string, village: VillageInfoType | null) {
  const budgetEntries = await safeQuery(() =>
    db.budgetEntry.findMany({
      where: { financialYear: fy },
      orderBy: [{ category: 'asc' }, { budgetHeadCode: 'asc' }],
    })
  );

  const incomeRows = budgetEntries.filter(b => b.category === 'income').map((b, i) => ({
    _sr: i + 1,
    code: b.budgetHeadCode || '',
    name: b.budgetHeadName || '',
    nameMr: b.budgetHeadNameMr || '',
    type: b.type || '',
    originalBudget: b.originalBudget,
    revisedBudget: b.revisedBudget,
    actual: b.actualAmount,
    reappropriation: r2((b.revisedBudget || b.originalBudget) - b.originalBudget),
  }));

  const expenditureRows = budgetEntries.filter(b => b.category === 'expenditure').map((b, i) => ({
    _sr: i + 1,
    code: b.budgetHeadCode || '',
    name: b.budgetHeadName || '',
    nameMr: b.budgetHeadNameMr || '',
    type: b.type || '',
    originalBudget: b.originalBudget,
    revisedBudget: b.revisedBudget,
    actual: b.actualAmount,
    reappropriation: r2((b.revisedBudget || b.originalBudget) - b.originalBudget),
  }));

  const allRows = [
    ...incomeRows.map(r => ({ ...r, section: 'उत्पन्न' })),
    ...expenditureRows.map(r => ({ ...r, section: 'खर्च' })),
  ];

  return {
    ...makeBase(2, 'नमुना २ - पुनर्विनियोजन व नियत वाटप', 'Namuna 2 - Re-appropriation', fy, village),
    headers: ['अ.क्र.', 'खाते कोड', 'खाते नाव', 'प्रकार', 'मूळ अंदाज (₹)', 'दुरुस्तीत अंदाज (₹)', 'वास्तव (₹)', 'पुनर्विनियोजन (₹)'],
    rows: allRows,
    totals: {
      totalIncomeBudget: r2(incomeRows.reduce((s, r) => s + (r.revisedBudget || r.originalBudget), 0)),
      totalExpenditureBudget: r2(expenditureRows.reduce((s, r) => s + (r.revisedBudget || r.originalBudget), 0)),
      totalReappropriation: r2(allRows.reduce((s, r) => s + r.reappropriation, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 3 - जमा खर्च विवरण (Income & Expenditure)
// ============================================================
async function generateNamuna3(fy: string, village: VillageInfoType | null) {
  const [receipts, payments] = await Promise.all([
    safeQuery(() => db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } })),
    safeQuery(() => db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } })),
  ]);

  const rows = [
    ...receipts.map((r, i) => ({
      _sr: i + 1,
      date: r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-IN') : '',
      voucher: r.voucherNumber || r.receiptNo,
      type: 'जमा',
      particulars: r.receivedFrom || r.payerName || '',
      head: r.headOfAccountMr || r.headOfAccount || '',
      debit: r.amount,
      credit: 0,
    })),
    ...payments.map((p, i) => ({
      _sr: receipts.length + i + 1,
      date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '',
      voucher: p.voucherNumber || p.voucherNo,
      type: 'नामे',
      particulars: p.paidTo || p.payeeName || '',
      head: p.headOfAccountMr || p.headOfAccount || '',
      debit: 0,
      credit: p.amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const totalDebit = r2(receipts.reduce((s, r) => s + r.amount, 0));
  const totalCredit = r2(payments.reduce((s, p) => s + p.amount, 0));

  return {
    ...makeBase(3, 'नमुना ३ - जमा खर्च विवरण', 'Namuna 3 - Income & Expenditure', fy, village),
    headers: ['अ.क्र.', 'दिनांक', 'वाउचर क्र.', 'प्रकार', 'विवरण', 'खाते शीर्ष', 'जमा (₹)', 'नामे (₹)'],
    rows,
    totals: {
      totalDebit,
      totalCredit,
      closingBalance: r2(totalDebit - totalCredit),
      receiptCount: receipts.length,
      paymentCount: payments.length,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 4 - मत्ता व दायित्वे (Assets & Liabilities)
// ============================================================
async function generateNamuna4(fy: string, village: VillageInfoType | null) {
  const [assets, bankAccounts, receipts, payments, namuna8s, namuna9s] = await Promise.all([
    safeQuery(() => db.assetEntry.findMany()),
    safeQuery(() => db.bankAccount.findMany()),
    safeQuery(() => db.receiptEntry.findMany({ where: { financialYear: fy } })),
    safeQuery(() => db.paymentEntry.findMany({ where: { financialYear: fy } })),
    safeQuery(() => db.taxAssessment.findMany({ where: { financialYear: fy } })),
    safeQuery(() => db.demandRegister.findMany({ where: { financialYear: fy }, include: { payments: true } })),
  ]);

  const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalBankBalance = bankAccounts.reduce((s, b) => s + b.balance, 0);
  const totalReceipts = receipts.reduce((s, r) => s + r.amount, 0);
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalTaxAssessed = namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0);
  const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
  const totalCollection = namuna9s.reduce((s, n) => s + n.totalCollection, 0);

  const assetRows = [
    { _sr: 1, type: 'मालमत्ता', typeEn: 'Assets', description: 'जंगम मालमत्ता', amount: r2(totalAssets) },
    { _sr: 2, type: 'मालमत्ता', typeEn: 'Assets', description: 'बँक शिल्लक', amount: r2(totalBankBalance) },
    { _sr: 3, type: 'मालमत्ता', typeEn: 'Assets', description: 'रोकड शिल्लक', amount: r2(totalReceipts - totalPayments) },
    { _sr: 4, type: 'दायित्वे', typeEn: 'Liabilities', description: 'कर मागणी बक्की', amount: r2(totalDemand - totalCollection) },
    { _sr: 5, type: 'दायित्वे', typeEn: 'Liabilities', description: 'एकूण कर आकारणी', amount: r2(totalTaxAssessed) },
  ];

  const totalAssetValue = r2(totalAssets + totalBankBalance + (totalReceipts - totalPayments));
  const totalLiabilityValue = r2(totalDemand - totalCollection);

  return {
    ...makeBase(4, 'नमुना ४ - मत्ता व दायित्वे', 'Namuna 4 - Assets & Liabilities', fy, village),
    headers: ['अ.क्र.', 'प्रकार', 'विवरण', 'रक्कम (₹)'],
    rows: assetRows,
    totals: {
      एकूण_मालमत्ता: totalAssetValue,
      एकूण_देणेदारी: totalLiabilityValue,
      निव्वळ_मूल्य: r2(totalAssetValue - totalLiabilityValue),
    },
    meta: { financialYear: fy, bankAccounts },
  };
}

// ============================================================
// NAMUNA 5 - सामान्य रोकड वही (General Cash Book)
// Cash book with running balance
// ============================================================
async function generateNamuna5(fy: string, village: VillageInfoType | null) {
  const [receipts, payments] = await Promise.all([
    safeQuery(() => db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } })),
    safeQuery(() => db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } })),
  ]);

  const allEntries = [
    ...receipts.map(r => ({
      date: r.receiptDate ? new Date(r.receiptDate).toISOString() : '',
      voucher: r.voucherNumber || r.receiptNo,
      type: 'जमा' as const,
      particulars: r.receivedFrom || r.payerName || '',
      debit: r.amount,
      credit: 0,
      head: r.headOfAccountMr || r.headOfAccount || '',
    })),
    ...payments.map(p => ({
      date: p.paymentDate ? new Date(p.paymentDate).toISOString() : '',
      voucher: p.voucherNumber || p.voucherNo,
      type: 'नामे' as const,
      particulars: p.paidTo || p.payeeName || '',
      debit: 0,
      credit: p.amount,
      head: p.headOfAccountMr || p.headOfAccount || '',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const rows = allEntries.map((e, i) => {
    balance += e.debit - e.credit;
    return {
      _sr: i + 1,
      date: e.date ? new Date(e.date).toLocaleDateString('en-IN') : '',
      voucher: e.voucher,
      type: e.type,
      particulars: e.particulars,
      head: e.head,
      debit: r2(e.debit),
      credit: r2(e.credit),
      balance: r2(balance),
    };
  });

  const totalDebit = r2(allEntries.reduce((s, e) => s + e.debit, 0));
  const totalCredit = r2(allEntries.reduce((s, e) => s + e.credit, 0));

  return {
    ...makeBase(5, 'नमुना ५ - सामान्य रोकड वही', 'Namuna 5 - General Cash Book', fy, village),
    headers: ['अ.क्र.', 'दिनांक', 'वाउचर क्र.', 'प्रकार', 'विवरण', 'खाते शीर्ष', 'जमा (₹)', 'नामे (₹)', 'शिल्लक (₹)'],
    rows,
    totals: {
      totalDebit,
      totalCredit,
      closingBalance: r2(balance),
      receiptCount: receipts.length,
      paymentCount: payments.length,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 5क - दैनिक रोकडवही (Daily Cash Book)
// ============================================================
async function generateNamuna5ka(fy: string, village: VillageInfoType | null) {
  const [receipts, payments] = await Promise.all([
    safeQuery(() => db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } })),
    safeQuery(() => db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } })),
  ]);

  const dateMap = new Map<string, { date: string; totalReceipt: number; totalPayment: number; receiptCount: number; paymentCount: number }>();

  for (const r of receipts) {
    const key = r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-IN') : '';
    if (!key) continue;
    if (!dateMap.has(key)) dateMap.set(key, { date: key, totalReceipt: 0, totalPayment: 0, receiptCount: 0, paymentCount: 0 });
    const entry = dateMap.get(key)!;
    entry.totalReceipt += r.amount;
    entry.receiptCount++;
  }

  for (const p of payments) {
    const key = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '';
    if (!key) continue;
    if (!dateMap.has(key)) dateMap.set(key, { date: key, totalReceipt: 0, totalPayment: 0, receiptCount: 0, paymentCount: 0 });
    const entry = dateMap.get(key)!;
    entry.totalPayment += p.amount;
    entry.paymentCount++;
  }

  const sortedRows = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = 0;
  const rows = sortedRows.map((r, i) => {
    runningBalance += r.totalReceipt - r.totalPayment;
    return {
      _sr: i + 1,
      date: r.date,
      totalReceipt: r2(r.totalReceipt),
      receiptCount: r.receiptCount,
      totalPayment: r2(r.totalPayment),
      paymentCount: r.paymentCount,
      balance: r2(runningBalance),
    };
  });

  return {
    ...makeBase(5, 'नमुना ५ क - दैनिक रोकडवही', 'Namuna 5ka - Daily Cash Book', fy, village),
    headers: ['अ.क्र.', 'दिनांक', 'एकूण प्राप्ती (₹)', 'प्राप्ती एंट्री', 'एकूण अर्ज (₹)', 'अर्ज एंट्री', 'शिल्लक (₹)'],
    rows,
    totals: {
      totalReceipts: r2(receipts.reduce((s, r) => s + r.amount, 0)),
      totalPayments: r2(payments.reduce((s, p) => s + p.amount, 0)),
      closingBalance: r2(runningBalance),
      totalDays: rows.length,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 6 - वर्गीकृत नोंदवही (Classified Register)
// Receipts classified by head of account
// ============================================================
async function generateNamuna6(fy: string, village: VillageInfoType | null) {
  const receipts = await safeQuery(() =>
    db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } })
  );

  const headMap = new Map<string, { code: string; name: string; nameMr: string; total: number; count: number }>();
  for (const r of receipts) {
    const key = r.headOfAccount || 'Unassigned';
    if (!headMap.has(key)) {
      headMap.set(key, { code: key, name: r.headOfAccount || key, nameMr: r.headOfAccountMr || '', total: 0, count: 0 });
    }
    const entry = headMap.get(key)!;
    entry.total += r.amount;
    entry.count++;
  }

  const rows = Array.from(headMap.values()).map((h, i) => ({
    _sr: i + 1,
    code: h.code,
    name: h.nameMr || h.name,
    count: h.count,
    total: r2(h.total),
  }));

  return {
    ...makeBase(6, 'नमुना ६ - वर्गीकृत नोंदवही', 'Namuna 6 - Classified Receipt Register', fy, village),
    headers: ['अ.क्र.', 'खाते कोड', 'खाते नाव', 'एंट्री संख्या', 'एकूण रक्कम (₹)'],
    rows,
    totals: {
      totalEntries: receipts.length,
      totalAmount: r2(receipts.reduce((s, r) => s + r.amount, 0)),
      totalHeads: headMap.size,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 7 - सामान्य पावती (General Receipt)
// ============================================================
async function generateNamuna7(fy: string, village: VillageInfoType | null) {
  const receipts = await safeQuery(() =>
    db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } })
  );

  const rows = receipts.map((r, i) => ({
    _sr: i + 1,
    receiptNo: r.receiptNo,
    date: r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-IN') : '',
    payerName: r.payerNameMr || r.payerName,
    amount: r.amount,
    taxType: r.taxType,
    paymentMode: r.paymentMode || r.paymentMethod,
    headOfAccount: r.headOfAccountMr || r.headOfAccount || '',
    description: r.description || '',
  }));

  return {
    ...makeBase(7, 'नमुना ७ - सामान्य पावती', 'Namuna 7 - General Receipt', fy, village),
    headers: ['अ.क्र.', 'पावती क्र.', 'दिनांक', 'देणाऱ्याचे नाव', 'रक्कम (₹)', 'कर प्रकार', 'देयक पद्धत', 'खाते शीर्ष', 'विवरण'],
    rows,
    totals: {
      totalEntries: receipts.length,
      totalAmount: r2(receipts.reduce((s, r) => s + r.amount, 0)),
      byTaxType: groupByField(receipts, 'taxType'),
      byPaymentMode: groupByField(receipts, 'paymentMode'),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 8 - कर आकारणी नोंदवही (Tax Assessment)
// ============================================================
async function generateNamuna8(fy: string, village: VillageInfoType | null) {
  const namuna8s = await safeQuery(() =>
    db.taxAssessment.findMany({
      where: { financialYear: fy },
      include: { property: { include: { ward: true, owners: { include: { owner: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
  );

  const rows = namuna8s.map((n, i) => {
    const primaryOwner = n.property?.owners?.find(o => o.ownershipType === 'मालक') || n.property?.owners?.[0];
    return {
      _sr: i + 1,
      propertyNumber: n.property?.propertyNo || '',
      ownerName: primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : n.property?.ownerName || '',
      wardName: n.property?.ward?.wardNameMr || n.property?.ward?.wardName || '',
      constructionType: n.property?.constructionType || '',
      usageType: n.property?.usageType || '',
      area: n.totalArea || n.property?.area || 0,
      capitalValue: n.capitalValue,
      houseTax: n.houseTaxAmt,
      lightTax: n.lightTaxAmt,
      healthTax: n.healthTaxAmt,
      waterTax: n.waterTaxAmt,
      totalTax: n.totalTaxAmt || n.totalTax,
    };
  });

  return {
    ...makeBase(8, 'नमुना ८ - कर आकारणी नोंदवही', 'Namuna 8 - Tax Assessment Register', fy, village),
    headers: ['अ.क्र.', 'मालमत्ता क्र.', 'मालक', 'वार्ड', 'बांधकाम', 'वापर', 'क्षेत्रफळ', 'भांडवली मूल्य (₹)', 'गृहकर (₹)', 'दिवाबती (₹)', 'आरोग्य (₹)', 'पाणी (₹)', 'एकूण कर (₹)'],
    rows,
    totals: {
      totalEntries: namuna8s.length,
      एकूण_कर: r2(namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0)),
      एकूण_गृहकर: r2(namuna8s.reduce((s, n) => s + n.houseTaxAmt, 0)),
      एकूण_दिवाबती: r2(namuna8s.reduce((s, n) => s + n.lightTaxAmt, 0)),
      एकूण_आरोग्य: r2(namuna8s.reduce((s, n) => s + n.healthTaxAmt, 0)),
      एकूण_पाणी: r2(namuna8s.reduce((s, n) => s + n.waterTaxAmt, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 9 - कर मागणी नोंदवही (Tax Demand Register)
// ============================================================
async function generateNamuna9(fy: string, village: VillageInfoType | null) {
  const namuna9s = await safeQuery(() =>
    db.demandRegister.findMany({
      where: { financialYear: fy },
      include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, payments: true },
      orderBy: { createdAt: 'desc' },
    })
  );

  const rows = namuna9s.map((n, i) => {
    const primaryOwner = n.property?.owners?.find(o => o.ownershipType === 'मालक') || n.property?.owners?.[0];
    const totalPaid = n.payments.reduce((s, p) => s + p.amountPaid, 0);
    return {
      _sr: i + 1,
      propertyNumber: n.property?.propertyNo || '',
      ownerName: primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : n.property?.ownerName || '',
      wardName: n.property?.ward?.wardNameMr || n.property?.ward?.wardName || '',
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
    ...makeBase(9, 'नमुना ९ - कर मागणी नोंदवही', 'Namuna 9 - Tax Demand Register', fy, village),
    headers: ['अ.क्र.', 'मालमत्ता क्र.', 'मालक', 'वार्ड', 'चालू कर (₹)', 'मागील बक्की (₹)', 'दंड (₹)', 'व्याज (₹)', 'एकूण मागणी (₹)', 'वसूल (₹)', 'शिल्लक (₹)'],
    rows,
    totals: {
      totalEntries: namuna9s.length,
      एकूण_मागणी: r2(rows.reduce((s, r) => s + r.totalDemand, 0)),
      एकूण_वसूल: r2(rows.reduce((s, r) => s + r.totalPaid, 0)),
      एकूण_शिल्लक: r2(rows.reduce((s, r) => s + r.outstanding, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 9क - कराची मागणी पावती (Tax Demand Bill)
// ============================================================
async function generateNamuna9ka(fy: string, village: VillageInfoType | null) {
  const namuna9s = await safeQuery(() =>
    db.demandRegister.findMany({
      where: { financialYear: fy },
      include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, payments: true },
      orderBy: { createdAt: 'desc' },
    })
  );

  const rows = namuna9s.map((n, i) => {
    const primaryOwner = n.property?.owners?.find(o => o.ownershipType === 'मालक') || n.property?.owners?.[0];
    const totalPaid = n.payments.reduce((s, p) => s + p.amountPaid, 0);
    return {
      _sr: i + 1,
      propertyNumber: n.property?.propertyNo || '',
      ownerName: primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : n.property?.ownerName || '',
      wardName: n.property?.ward?.wardNameMr || n.property?.ward?.wardName || '',
      openingBalance: n.openingBalance,
      currentTax: n.currentTax,
      penalty: n.penalty,
      discount: n.discount,
      interest: n.interest,
      totalDemand: n.totalDemand,
      totalPaid: r2(totalPaid),
      balance: r2(n.totalDemand - totalPaid),
    };
  });

  return {
    ...makeBase(9, 'नमुना ९ क - कराची मागणी पावती', 'Namuna 9ka - Tax Demand Bill', fy, village),
    headers: ['अ.क्र.', 'मालमत्ता क्र.', 'मालक', 'वार्ड', 'प्रारंभ शिल्लक (₹)', 'चालू कर (₹)', 'दंड (₹)', 'सवलत (₹)', 'व्याज (₹)', 'एकूण मागणी (₹)', 'भरलेले (₹)', 'बक्की (₹)'],
    rows,
    totals: {
      totalBills: namuna9s.length,
      एकूण_मागणी: r2(rows.reduce((s, r) => s + r.totalDemand, 0)),
      एकूण_भरलेले: r2(rows.reduce((s, r) => s + r.totalPaid, 0)),
      एकूण_बक्की: r2(rows.reduce((s, r) => s + r.balance, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 10 - कर व फी पावती (Tax & Fee Receipt)
// ============================================================
async function generateNamuna10(fy: string, village: VillageInfoType | null) {
  const [payments, collectionEntries] = await Promise.all([
    safeQuery(() =>
      db.taxPayment.findMany({
        where: { financialYear: fy },
        include: { property: { include: { ward: true, owners: { include: { owner: true } } } } },
        orderBy: { paymentDate: 'desc' },
      })
    ),
    safeQuery(() => db.collectionEntry.findMany({ where: { financialYear: fy }, orderBy: { collectionDate: 'desc' } })),
  ]);

  const rows = payments.map((p, i) => {
    const primaryOwner = p.property?.owners?.find(o => o.ownershipType === 'मालक') || p.property?.owners?.[0];
    return {
      _sr: i + 1,
      receiptNo: p.receiptNo,
      date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '',
      propertyNumber: p.property?.propertyNo || '',
      ownerName: primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : p.property?.ownerName || '',
      amount: p.amount,
      amountPaid: p.amountPaid,
      paymentMode: p.paymentMode,
    };
  });

  return {
    ...makeBase(10, 'नमुना १० - कर व फी पावती', 'Namuna 10 - Tax & Fee Receipt', fy, village),
    headers: ['अ.क्र.', 'पावती क्र.', 'दिनांक', 'मालमत्ता क्र.', 'मालक', 'मागणी (₹)', 'भरलेले (₹)', 'देयक पद्धत'],
    rows,
    totals: {
      totalReceipts: payments.length,
      एकूण_मागणी: r2(payments.reduce((s, p) => s + p.totalDemand, 0)),
      एकूण_भरलेले: r2(payments.reduce((s, p) => s + p.amountPaid, 0)),
      collectionCount: collectionEntries.length,
      collectionTotal: r2(collectionEntries.reduce((s, c) => s + c.amount, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 11 - किरकोळ कर व फी आकारणी (Misc Tax)
// ============================================================
async function generateNamuna11(fy: string, village: VillageInfoType | null) {
  const [receipts, taxMasters] = await Promise.all([
    safeQuery(() => db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } })),
    safeQuery(() => db.taxMaster.findMany()),
  ]);

  const taxTypeMap = new Map(taxMasters.map(t => [t.id, t]));

  const rows = receipts.map((r, i) => ({
    _sr: i + 1,
    receiptNo: r.receiptNo,
    date: r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-IN') : '',
    payerName: r.payerNameMr || r.payerName,
    taxType: r.taxType,
    amount: r.amount,
    headOfAccount: r.headOfAccountMr || r.headOfAccount || '',
    paymentMode: r.paymentMode || r.paymentMethod,
  }));

  const groupedByTax = new Map<string, number>();
  for (const r of receipts) {
    const key = r.taxType || 'Other';
    groupedByTax.set(key, (groupedByTax.get(key) || 0) + r.amount);
  }

  return {
    ...makeBase(11, 'नमुना ११ - किरकोळ कर व फी आकारणी', 'Namuna 11 - Misc Tax Assessment', fy, village),
    headers: ['अ.क्र.', 'पावती क्र.', 'दिनांक', 'देणारा', 'कर प्रकार', 'रक्कम (₹)', 'खाते शीर्ष', 'देयक पद्धत'],
    rows,
    totals: {
      totalEntries: receipts.length,
      एकूण_रक्कम: r2(receipts.reduce((s, r) => s + r.amount, 0)),
      byTaxType: Object.fromEntries(groupedByTax),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 12 - अकस्मात खर्च प्रमाणक (Contingent Voucher)
// ============================================================
async function generateNamuna12(fy: string, village: VillageInfoType | null) {
  const paymentEntries = await safeQuery(() =>
    db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'desc' } })
  );

  const rows = paymentEntries.map((p, i) => ({
    _sr: i + 1,
    voucherNo: p.voucherNo,
    voucherNumber: p.voucherNumber || p.voucherNo,
    date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '',
    payeeName: p.payeeNameMr || p.payeeName,
    amount: p.amount,
    headOfAccount: p.headOfAccountMr || p.headOfAccount,
    paymentMode: p.paymentMode || p.paymentMethod,
    description: p.description || '',
    paidTo: p.paidTo || '',
  }));

  return {
    ...makeBase(12, 'नमुना १२ - अकस्मात खर्च प्रमाणक', 'Namuna 12 - Contingent Voucher', fy, village),
    headers: ['अ.क्र.', 'वाउचर क्र.', 'वाउचर नंबर', 'दिनांक', 'प्राप्तकर्ता', 'रक्कम (₹)', 'खाते शीर्ष', 'देयक पद्धत', 'विवरण', 'कोणास दिले'],
    rows,
    totals: {
      totalEntries: paymentEntries.length,
      एकूण_खर्च: r2(paymentEntries.reduce((s, p) => s + p.amount, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 13 - कर्मचारी नोंदवही (Employee Register)
// ============================================================
async function generateNamuna13(fy: string, village: VillageInfoType | null) {
  const employees = await safeQuery(() => db.employeeMaster.findMany({ orderBy: { employeeName: 'asc' } }));

  const rows = employees.map((e, i) => ({
    _sr: i + 1,
    employeeName: e.employeeNameMr || e.employeeName,
    designation: e.designationMr || e.designation,
    department: e.department || '',
    payScale: e.payScale || '',
    basicPay: e.basicPay || 0,
    da: e.da || 0,
    hra: e.hra || 0,
    grossSalary: e.grossSalary || 0,
    dateOfJoining: e.dateOfJoining || '',
    dateOfRetirement: e.dateOfRetirement || '',
    isActive: e.isActive ? 'सक्रिय' : 'निष्क्रिय',
  }));

  return {
    ...makeBase(13, 'नमुना १३ - कर्मचारी नोंदवही', 'Namuna 13 - Employee Register', fy, village),
    headers: ['अ.क्र.', 'नाव', 'पद', 'विभाग', 'वेतनमान', 'मूळ वेतन (₹)', 'महागाई (₹)', 'घरभाडे (₹)', 'एकूण वेतन (₹)', 'रुजू दिनांक', 'निवृत्ती दिनांक', 'स्थिती'],
    rows,
    totals: {
      totalEmployees: employees.length,
      activeCount: employees.filter(e => e.isActive).length,
      एकूण_वेतन: r2(employees.reduce((s, e) => s + (e.grossSalary || 0), 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 14 - मुद्रांक हिशोब (Stamp Account)
// ============================================================
async function generateNamuna14(fy: string, village: VillageInfoType | null) {
  const receipts = await safeQuery(() =>
    db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } })
  );

  // Group by tax type for stamp-like accounting
  const headMap = new Map<string, { head: string; headMr: string; count: number; total: number }>();
  for (const r of receipts) {
    const key = r.headOfAccount || r.taxType || 'Unassigned';
    if (!headMap.has(key)) {
      headMap.set(key, { head: key, headMr: r.headOfAccountMr || key, count: 0, total: 0 });
    }
    const entry = headMap.get(key)!;
    entry.count++;
    entry.total += r.amount;
  }

  const rows = Array.from(headMap.values()).map((h, i) => ({
    _sr: i + 1,
    headOfAccount: h.headMr || h.head,
    count: h.count,
    total: r2(h.total),
  }));

  return {
    ...makeBase(14, 'नमुना १४ - मुद्रांक हिशोब', 'Namuna 14 - Stamp Account', fy, village),
    headers: ['अ.क्र.', 'खाते शीर्ष', 'एंट्री संख्या', 'एकूण रक्कम (₹)'],
    rows,
    totals: {
      totalHeads: headMap.size,
      totalEntries: receipts.length,
      एकूण_रक्कम: r2(receipts.reduce((s, r) => s + r.amount, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 15 - उपभोग्य वस्तू साठा (Consumable Stock)
// ============================================================
async function generateNamuna15(fy: string, village: VillageInfoType | null) {
  const stocks = await safeQuery(() =>
    db.stockEntry.findMany({ where: { financialYear: fy }, orderBy: { stockNumber: 'asc' } })
  );

  const rows = stocks.map((s, i) => ({
    _sr: i + 1,
    stockNumber: s.stockNumber || '',
    itemName: s.itemNameMr || s.itemName,
    category: s.category || 'Other',
    unit: s.unit || '',
    quantity: s.quantity,
    ratePerUnit: s.ratePerUnit || 0,
    totalValue: s.totalValue,
    minStock: s.minStock || 0,
    maxStock: s.maxStock || 0,
    lastPurchaseDate: s.lastPurchaseDate || '',
    supplier: s.supplier || '',
    status: s.status,
  }));

  return {
    ...makeBase(15, 'नमुना १५ - उपभोग्य वस्तू साठा', 'Namuna 15 - Consumable Stock Register', fy, village),
    headers: ['अ.क्र.', 'साठा क्र.', 'वस्तूचे नाव', 'वर्ग', 'एकक', 'प्रमाण', 'दर प्रति एकक (₹)', 'एकूण मूल्य (₹)', 'किमान साठा', 'कमाल साठा', 'शेवटची खरेदी', 'पुरवठादार', 'स्थिती'],
    rows,
    totals: {
      totalItems: stocks.length,
      एकूण_मूल्य: r2(stocks.reduce((s, st) => s + st.totalValue, 0)),
      totalQuantity: stocks.reduce((s, st) => s + st.quantity, 0),
      inStockCount: stocks.filter(s => s.status === 'In Stock').length,
      byCategory: groupByField(stocks, 'category'),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 16 - जडवस्तू संग्रह (Dead Stock / Movable Property)
// ============================================================
async function generateNamuna16(fy: string, village: VillageInfoType | null) {
  const assets = await safeQuery(() =>
    db.assetEntry.findMany({ where: { financialYear: fy }, orderBy: { assetNumber: 'asc' } })
  );

  const rows = assets.map((a, i) => ({
    _sr: i + 1,
    assetNumber: a.assetNumber || '',
    assetName: a.assetNameMr || a.assetName,
    assetType: a.assetType || 'Other',
    category: a.category || '',
    serialNo: a.serialNo || '',
    purchaseDate: a.purchaseDate || '',
    purchaseCost: a.purchaseCost,
    currentValue: a.currentValue,
    depreciation: a.depreciation,
    location: a.location || '',
    condition: a.condition || '',
    status: a.status,
  }));

  return {
    ...makeBase(16, 'नमुना १६ - जडवस्तू संग्रह व जंगम मालमत्ता', 'Namuna 16 - Dead Stock & Movable Property', fy, village),
    headers: ['अ.क्र.', 'मालमत्ता क्र.', 'नाव', 'प्रकार', 'वर्ग', 'क्रमांक', 'खरेदी दिनांक', 'खरेदी किंमत (₹)', 'सध्याची किंमत (₹)', 'घसरण (₹)', 'स्थान', 'स्थिती', 'दर्जा'],
    rows,
    totals: {
      totalAssets: assets.length,
      एकूण_खरेदी_किंमत: r2(assets.reduce((s, a) => s + a.purchaseCost, 0)),
      एकूण_सध्याची_किंमत: r2(assets.reduce((s, a) => s + a.currentValue, 0)),
      एकूण_घसरण: r2(assets.reduce((s, a) => s + a.depreciation, 0)),
      activeCount: assets.filter(a => a.status === 'active').length,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 17 - अग्रीम/अनामत (Advance/Deposit)
// ============================================================
async function generateNamuna17(fy: string, village: VillageInfoType | null) {
  const [receipts, payments] = await Promise.all([
    safeQuery(() => db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } })),
    safeQuery(() => db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } })),
  ]);

  // Deposits = receipts with advance/deposit keywords; Advances = payments with advance keywords
  const deposits = receipts.filter(r =>
    (r.headOfAccount && /advance|deposit|अनामत|अग्रीम/i.test(r.headOfAccount)) ||
    (r.description && /advance|deposit|अनामत|अग्रीम/i.test(r.description))
  );
  const advances = payments.filter(p =>
    (p.headOfAccount && /advance|अग्रीम/i.test(p.headOfAccount)) ||
    (p.description && /advance|अग्रीम/i.test(p.description))
  );

  const rows = [
    ...deposits.map((r, i) => ({
      _sr: i + 1,
      date: r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-IN') : '',
      type: 'अनामत',
      voucher: r.voucherNumber || r.receiptNo,
      particulars: r.receivedFrom || r.payerName || '',
      amount: r.amount,
      head: r.headOfAccountMr || r.headOfAccount || '',
    })),
    ...advances.map((p, i) => ({
      _sr: deposits.length + i + 1,
      date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '',
      type: 'अग्रीम',
      voucher: p.voucherNumber || p.voucherNo,
      particulars: p.paidTo || p.payeeName || '',
      amount: p.amount,
      head: p.headOfAccountMr || p.headOfAccount || '',
    })),
  ];

  return {
    ...makeBase(17, 'नमुना १७ - अग्रीम/अनामत रक्कम नोंदवही', 'Namuna 17 - Advance & Deposit Register', fy, village),
    headers: ['अ.क्र.', 'दिनांक', 'प्रकार', 'वाउचर क्र.', 'विवरण', 'रक्कम (₹)', 'खाते शीर्ष'],
    rows,
    totals: {
      totalDeposits: deposits.length,
      totalAdvances: advances.length,
      एकूण_अनामत: r2(deposits.reduce((s, r) => s + r.amount, 0)),
      एकूण_अग्रीम: r2(advances.reduce((s, p) => s + p.amount, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 18 - किरकोळ रोकडवही (Petty Cash Book)
// ============================================================
async function generateNamuna18(fy: string, village: VillageInfoType | null) {
  const [receipts, payments] = await Promise.all([
    safeQuery(() => db.receiptEntry.findMany({ where: { financialYear: fy, paymentMethod: 'cash' }, orderBy: { receiptDate: 'asc' } })),
    safeQuery(() => db.paymentEntry.findMany({ where: { financialYear: fy, paymentMethod: 'cash' }, orderBy: { paymentDate: 'asc' } })),
  ]);

  const allEntries = [
    ...receipts.map(r => ({
      date: r.receiptDate ? new Date(r.receiptDate).toISOString() : '',
      voucher: r.voucherNumber || r.receiptNo,
      type: 'जमा' as const,
      particulars: r.receivedFrom || r.payerName || '',
      debit: r.amount,
      credit: 0,
      head: r.headOfAccountMr || r.headOfAccount || '',
    })),
    ...payments.map(p => ({
      date: p.paymentDate ? new Date(p.paymentDate).toISOString() : '',
      voucher: p.voucherNumber || p.voucherNo,
      type: 'नामे' as const,
      particulars: p.paidTo || p.payeeName || '',
      debit: 0,
      credit: p.amount,
      head: p.headOfAccountMr || p.headOfAccount || '',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const rows = allEntries.map((e, i) => {
    balance += e.debit - e.credit;
    return {
      _sr: i + 1,
      date: e.date ? new Date(e.date).toLocaleDateString('en-IN') : '',
      voucher: e.voucher,
      type: e.type,
      particulars: e.particulars,
      head: e.head,
      debit: r2(e.debit),
      credit: r2(e.credit),
      balance: r2(balance),
    };
  });

  return {
    ...makeBase(18, 'नमुना १८ - किरकोळ रोकडवही', 'Namuna 18 - Petty Cash Book', fy, village),
    headers: ['अ.क्र.', 'दिनांक', 'वाउचर क्र.', 'प्रकार', 'विवरण', 'खाते शीर्ष', 'जमा (₹)', 'नामे (₹)', 'शिल्लक (₹)'],
    rows,
    totals: {
      totalDebit: r2(allEntries.reduce((s, e) => s + e.debit, 0)),
      totalCredit: r2(allEntries.reduce((s, e) => s + e.credit, 0)),
      closingBalance: r2(balance),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 19 - हजेरीपट (Muster Roll)
// ============================================================
async function generateNamuna19(fy: string, village: VillageInfoType | null) {
  const workEntries = await safeQuery(() =>
    db.workEntry.findMany({ where: { financialYear: fy }, orderBy: { workName: 'asc' } })
  );

  const rows = workEntries.map((w, i) => ({
    _sr: i + 1,
    workName: w.workNameMr || w.workName,
    schemeName: w.schemeName || '',
    estimatedCost: w.estimatedCost,
    approvedCost: w.approvedCost || 0,
    contractorName: w.contractorMr || w.contractorName || '',
    startDate: w.startDate || '',
    endDate: w.endDate || '',
    progressPercent: w.progressPercent,
    status: w.status,
  }));

  return {
    ...makeBase(19, 'नमुना १९ - हजेरीपट', 'Namuna 19 - Muster Roll', fy, village),
    headers: ['अ.क्र.', 'कामाचे नाव', 'योजना', 'अंदाजित खर्च (₹)', 'मंजूर खर्च (₹)', 'कंत्राटदार', 'सुरू दिनांक', 'समाप्ती दिनांक', 'प्रगती %', 'स्थिती'],
    rows,
    totals: {
      totalWorks: workEntries.length,
      एकूण_अंदाजित_खर्च: r2(workEntries.reduce((s, w) => s + w.estimatedCost, 0)),
      एकूण_मंजूर_खर्च: r2(workEntries.reduce((s, w) => s + (w.approvedCost || 0), 0)),
      averageProgress: workEntries.length ? r2(workEntries.reduce((s, w) => s + w.progressPercent, 0) / workEntries.length) : 0,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 20 - कामाच्या अंदाजाची नोंदवही (Work Estimate)
// ============================================================
async function generateNamuna20(fy: string, village: VillageInfoType | null) {
  const workEntries = await safeQuery(() =>
    db.workEntry.findMany({
      where: { financialYear: fy },
      include: { head: true },
      orderBy: { workName: 'asc' },
    })
  );

  const rows = workEntries.map((w, i) => ({
    _sr: i + 1,
    workName: w.workNameMr || w.workName,
    schemeName: w.schemeName || '',
    budgetHead: w.head?.headNameMr || w.head?.headName || '',
    estimatedCost: w.estimatedCost,
    approvedCost: w.approvedCost || 0,
    tenderAmount: w.tenderAmount || 0,
    contractorName: w.contractorMr || w.contractorName || '',
    startDate: w.startDate || '',
    endDate: w.endDate || '',
    completionDate: w.completionDate || '',
    progressPercent: w.progressPercent,
    status: w.status,
  }));

  return {
    ...makeBase(20, 'नमुना २० - कामाच्या अंदाजाची नोंदवही', 'Namuna 20 - Work Estimate Register', fy, village),
    headers: ['अ.क्र.', 'कामाचे नाव', 'योजना', 'बजेट शीर्ष', 'अंदाजित खर्च (₹)', 'मंजूर खर्च (₹)', 'टेंडर रक्कम (₹)', 'कंत्राटदार', 'सुरू', 'समाप्ती', 'पूर्तता', 'प्रगती %', 'स्थिती'],
    rows,
    totals: {
      totalWorks: workEntries.length,
      एकूण_अंदाजित_खर्च: r2(workEntries.reduce((s, w) => s + w.estimatedCost, 0)),
      एकूण_मंजूर_खर्च: r2(workEntries.reduce((s, w) => s + (w.approvedCost || 0), 0)),
      completedWorks: workEntries.filter(w => w.status === 'completed').length,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 20क - मोजमाप वही (Measurement Book)
// ============================================================
async function generateNamuna20ka(fy: string, village: VillageInfoType | null) {
  const workEntries = await safeQuery(() =>
    db.workEntry.findMany({
      where: { financialYear: fy, status: { in: ['in_progress', 'completed'] } },
      orderBy: { workName: 'asc' },
    })
  );

  const rows = workEntries.map((w, i) => ({
    _sr: i + 1,
    workName: w.workNameMr || w.workName,
    schemeName: w.schemeName || '',
    estimatedCost: w.estimatedCost,
    progressPercent: w.progressPercent,
    workValue: r2(w.estimatedCost * w.progressPercent / 100),
    contractorName: w.contractorMr || w.contractorName || '',
    status: w.status,
  }));

  return {
    ...makeBase(20, 'नमुना २० क - मोजमाप वही', 'Namuna 20ka - Measurement Book', fy, village),
    headers: ['अ.क्र.', 'कामाचे नाव', 'योजना', 'अंदाजित खर्च (₹)', 'प्रगती %', 'कामाचे मूल्य (₹)', 'कंत्राटदार', 'स्थिती'],
    rows,
    totals: {
      totalWorks: workEntries.length,
      एकूण_कामाचे_मूल्य: r2(rows.reduce((s, r) => s + r.workValue, 0)),
      averageProgress: workEntries.length ? r2(workEntries.reduce((s, w) => s + w.progressPercent, 0) / workEntries.length) : 0,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 20ख - कामाचे देयक (Work Bill)
// ============================================================
async function generateNamuna20kha(fy: string, village: VillageInfoType | null) {
  const [workEntries, paymentEntries] = await Promise.all([
    safeQuery(() => db.workEntry.findMany({ where: { financialYear: fy }, orderBy: { workName: 'asc' } })),
    safeQuery(() => db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'desc' } })),
  ]);

  const rows = workEntries.map((w, i) => ({
    _sr: i + 1,
    workName: w.workNameMr || w.workName,
    contractorName: w.contractorMr || w.contractorName || '',
    estimatedCost: w.estimatedCost,
    approvedCost: w.approvedCost || 0,
    tenderAmount: w.tenderAmount || 0,
    progressPercent: w.progressPercent,
    billAmount: r2((w.approvedCost || w.estimatedCost) * w.progressPercent / 100),
    status: w.status,
  }));

  return {
    ...makeBase(20, 'नमुना २० ख - कामाचे देयक', 'Namuna 20kha - Work Bill', fy, village),
    headers: ['अ.क्र.', 'कामाचे नाव', 'कंत्राटदार', 'अंदाजित (₹)', 'मंजूर (₹)', 'टेंडर (₹)', 'प्रगती %', 'देयक रक्कम (₹)', 'स्थिती'],
    rows,
    totals: {
      totalWorks: workEntries.length,
      एकूण_देयक: r2(rows.reduce((s, r) => s + r.billAmount, 0)),
      एकूण_मंजूर: r2(workEntries.reduce((s, w) => s + (w.approvedCost || 0), 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 21 - कर्मचाऱ्याच्या देयकाची नोंदवही (Employee Bill)
// ============================================================
async function generateNamuna21(fy: string, village: VillageInfoType | null) {
  const salaryEntries = await safeQuery(() =>
    db.salaryEntry.findMany({
      where: { financialYear: fy },
      include: { employee: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })
  );

  const rows = salaryEntries.map((s, i) => ({
    _sr: i + 1,
    employeeName: s.employee?.employeeNameMr || s.employee?.employeeName || '',
    designation: s.employee?.designationMr || s.employee?.designation || '',
    month: s.month,
    year: s.year,
    basicPay: s.basicPay,
    da: s.da,
    hra: s.hra,
    ma: s.ma,
    deductions: s.deductions,
    netPay: s.netPay,
    paymentDate: s.paymentDate ? new Date(s.paymentDate).toLocaleDateString('en-IN') : '',
    paymentMode: s.paymentMode,
  }));

  return {
    ...makeBase(21, 'नमुना २१ - कर्मचाऱ्याच्या देयकाची नोंदवही', 'Namuna 21 - Employee Bill Register', fy, village),
    headers: ['अ.क्र.', 'कर्मचारी', 'पद', 'महिना', 'वर्ष', 'मूळ वेतन (₹)', 'महागाई (₹)', 'घरभाडे (₹)', 'भत्ता (₹)', 'कपाती (₹)', 'निव्वळ वेतन (₹)', 'देयक दिनांक', 'देयक पद्धत'],
    rows,
    totals: {
      totalEntries: salaryEntries.length,
      एकूण_निव्वळ_वेतन: r2(salaryEntries.reduce((s, e) => s + e.netPay, 0)),
      एकूण_कपाती: r2(salaryEntries.reduce((s, e) => s + e.deductions, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 22 - स्थावर मालमत्ता (Immovable Property) - Namuna22 model
// ============================================================
async function generateNamuna22(fy: string, village: VillageInfoType | null) {
  const entries = await safeQuery(() =>
    db.immovableProperty.findMany({ where: { financialYear: fy }, orderBy: { propertyName: 'asc' } })
  );

  const rows = entries.map((e, i) => ({
    _sr: i + 1,
    propertyName: e.propertyNameMr || e.propertyName,
    propertyDesc: e.propertyDescMr || e.propertyDesc || '',
    acquisitionDate: e.acquisitionDate || '',
    acquisitionMode: e.acquisitionMode || '',
    originalValue: e.originalValue || 0,
    constructionCost: e.constructionCost || 0,
    currentValue: e.currentValue || 0,
    location: e.location || '',
    areaSqFt: e.areaSqFt || 0,
    mapNo: e.mapNo || '',
    plotNo: e.plotNo || '',
    usageType: e.usageType || '',
    condition: e.condition || '',
  }));

  return {
    ...makeBase(22, 'नमुना २२ - स्थावर मालमत्ता नोंदवही', 'Namuna 22 - Immovable Property Register', fy, village),
    headers: ['अ.क्र.', 'मालमत्ता नाव', 'वर्णन', 'संपादन दिनांक', 'संपादन पद्धत', 'मूळ मूल्य (₹)', 'बांधकाम खर्च (₹)', 'सध्याचे मूल्य (₹)', 'स्थान', 'क्षेत्रफळ (चौ.फूट)', 'नकाशा क्र.', 'प्लॉट क्र.', 'वापर', 'दर्जा'],
    rows,
    totals: {
      totalProperties: entries.length,
      एकूण_मूळ_मूल्य: r2(entries.reduce((s, e) => s + (e.originalValue || 0), 0)),
      एकूण_बांधकाम_खर्च: r2(entries.reduce((s, e) => s + (e.constructionCost || 0), 0)),
      एकूण_सध्याचे_मूल्य: r2(entries.reduce((s, e) => s + (e.currentValue || 0), 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 23 - ताब्यातील रस्ते (Road Register) - Namuna23 model
// ============================================================
async function generateNamuna23(fy: string, village: VillageInfoType | null) {
  const entries = await safeQuery(() =>
    db.roadAsset.findMany({ where: { financialYear: fy }, orderBy: { roadName: 'asc' } })
  );

  const rows = entries.map((e, i) => ({
    _sr: i + 1,
    roadName: e.roadNameMr || e.roadName,
    roadType: e.roadType || '',
    roadLength: e.roadLength || 0,
    roadWidth: e.roadWidth || 0,
    surfaceType: e.surfaceType || '',
    constructionYear: e.constructionYear || '',
    lastRepairYear: e.lastRepairYear || '',
    estimatedCost: e.estimatedCost || 0,
    location: e.location || '',
    connectingFrom: e.connectingFrom || '',
    connectingTo: e.connectingTo || '',
    condition: e.condition || '',
  }));

  return {
    ...makeBase(23, 'नमुना २३ - ताब्यातील रस्त्यांची नोंदवही', 'Namuna 23 - Road Register', fy, village),
    headers: ['अ.क्र.', 'रस्ता नाव', 'प्रकार', 'लांबी (मी)', 'रुंदी (मी)', 'पृष्ठभाग', 'बांधकाम वर्ष', 'दुरुस्ती वर्ष', 'अंदाजित खर्च (₹)', 'स्थान', 'येथून', 'येथपर्यंत', 'दर्जा'],
    rows,
    totals: {
      totalRoads: entries.length,
      एकूण_लांबी: r2(entries.reduce((s, e) => s + (e.roadLength || 0), 0)),
      एकूण_अंदाजित_खर्च: r2(entries.reduce((s, e) => s + (e.estimatedCost || 0), 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 24 - जमिनीची नोंदवही (Land Register) - Namuna24 model
// ============================================================
async function generateNamuna24(fy: string, village: VillageInfoType | null) {
  const entries = await safeQuery(() =>
    db.landAsset.findMany({ where: { financialYear: fy }, orderBy: { landName: 'asc' } })
  );

  const rows = entries.map((e, i) => ({
    _sr: i + 1,
    landName: e.landNameMr || e.landName,
    surveyNo: e.surveyNo || '',
    areaAcres: e.areaAcres || 0,
    areaHectares: e.areaHectares || 0,
    areaGunthe: e.areaGunthe || 0,
    landType: e.landType || '',
    ownershipType: e.ownershipType || '',
    eastBoundary: e.eastBoundary || '',
    westBoundary: e.westBoundary || '',
    northBoundary: e.northBoundary || '',
    southBoundary: e.southBoundary || '',
    usageType: e.usageType || '',
    mapNo: e.mapNo || '',
    gatNo: e.gatNo || '',
  }));

  return {
    ...makeBase(24, 'नमुना २४ - जमिनीची नोंदवही', 'Namuna 24 - Land Register', fy, village),
    headers: ['अ.क्र.', 'जमीन नाव', 'सर्वेक्षण क्र.', 'एकर', 'हेक्टर', 'गुंठे', 'जमीन प्रकार', 'मालकी हक्क', 'पूर्व सीमा', 'पश्चिम सीमा', 'उत्तर सीमा', 'दक्षिण सीमा', 'वापर', 'नकाशा क्र.', 'गाट क्र.'],
    rows,
    totals: {
      totalLands: entries.length,
      एकूण_एकर: r2(entries.reduce((s, e) => s + (e.areaAcres || 0), 0)),
      एकूण_हेक्टर: r2(entries.reduce((s, e) => s + (e.areaHectares || 0), 0)),
      एकूण_गुंठे: r2(entries.reduce((s, e) => s + (e.areaGunthe || 0), 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 25 - गुंतवणूक (Investment Register)
// ============================================================
async function generateNamuna25(fy: string, village: VillageInfoType | null) {
  const [bankAccounts, schemeInfos] = await Promise.all([
    safeQuery(() => db.bankAccount.findMany()),
    safeQuery(() => db.schemeInfo.findMany({ where: { financialYear: fy } })),
  ]);

  const rows = [
    ...bankAccounts.map((b, i) => ({
      _sr: i + 1,
      name: b.bankName + (b.branchName ? ` - ${b.branchName}` : ''),
      type: 'बँक ठेव',
      accountNo: b.accountNo,
      openingBalance: b.openingBalance,
      currentBalance: b.balance,
      interestOrReturn: 0,
    })),
    ...schemeInfos.map((s, i) => ({
      _sr: bankAccounts.length + i + 1,
      name: s.schemeNameMr || s.schemeName,
      type: 'योजना',
      accountNo: s.schemeCode || '',
      openingBalance: s.grantAmount || 0,
      currentBalance: s.balance,
      interestOrReturn: 0,
    })),
  ];

  return {
    ...makeBase(25, 'नमुना २५ - गुंतवणूक नोंदवही', 'Namuna 25 - Investment Register', fy, village),
    headers: ['अ.क्र.', 'नाव', 'प्रकार', 'खाते/योजना क्र.', 'प्रारंभ शिल्लक (₹)', 'चालू शिल्लक (₹)', 'व्याज/परतावा (₹)'],
    rows,
    totals: {
      totalInvestments: rows.length,
      एकूण_प्रारंभ: r2(rows.reduce((s, r) => s + r.openingBalance, 0)),
      एकूण_चालू: r2(rows.reduce((s, r) => s + r.currentBalance, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 26क - जमा मासिक विवरण (Monthly Income Statement)
// ============================================================
async function generateNamuna26ka(fy: string, village: VillageInfoType | null) {
  const receipts = await safeQuery(() =>
    db.receiptEntry.findMany({ where: { financialYear: fy }, orderBy: { receiptDate: 'asc' } })
  );

  const monthMap = new Map<string, { month: string; total: number; count: number }>();
  const monthNames = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

  for (const r of receipts) {
    if (!r.receiptDate) continue;
    const d = new Date(r.receiptDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = monthNames[d.getMonth()] + ' ' + d.getFullYear();
    if (!monthMap.has(key)) monthMap.set(key, { month: label, total: 0, count: 0 });
    const entry = monthMap.get(key)!;
    entry.total += r.amount;
    entry.count++;
  }

  const rows = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v], i) => ({
      _sr: i + 1,
      month: v.month,
      count: v.count,
      total: r2(v.total),
    }));

  return {
    ...makeBase(26, 'नमुना २६ क - जमा मासिक विवरण', 'Namuna 26ka - Monthly Income Statement', fy, village),
    headers: ['अ.क्र.', 'महिना', 'एंट्री संख्या', 'एकूण उत्पन्न (₹)'],
    rows,
    totals: {
      totalMonths: rows.length,
      एकूण_उत्पन्न: r2(receipts.reduce((s, r) => s + r.amount, 0)),
      totalEntries: receipts.length,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 26ख - खर्च मासिक विवरण (Monthly Expenditure Statement)
// ============================================================
async function generateNamuna26kha(fy: string, village: VillageInfoType | null) {
  const payments = await safeQuery(() =>
    db.paymentEntry.findMany({ where: { financialYear: fy }, orderBy: { paymentDate: 'asc' } })
  );

  const monthMap = new Map<string, { month: string; total: number; count: number }>();
  const monthNames = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

  for (const p of payments) {
    if (!p.paymentDate) continue;
    const d = new Date(p.paymentDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = monthNames[d.getMonth()] + ' ' + d.getFullYear();
    if (!monthMap.has(key)) monthMap.set(key, { month: label, total: 0, count: 0 });
    const entry = monthMap.get(key)!;
    entry.total += p.amount;
    entry.count++;
  }

  const rows = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v], i) => ({
      _sr: i + 1,
      month: v.month,
      count: v.count,
      total: r2(v.total),
    }));

  return {
    ...makeBase(26, 'नमुना २६ ख - खर्च मासिक विवरण', 'Namuna 26kha - Monthly Expenditure Statement', fy, village),
    headers: ['अ.क्र.', 'महिना', 'एंट्री संख्या', 'एकूण खर्च (₹)'],
    rows,
    totals: {
      totalMonths: rows.length,
      एकूण_खर्च: r2(payments.reduce((s, p) => s + p.amount, 0)),
      totalEntries: payments.length,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 27 - लेखापरीक्षण आक्षेप (Audit Objection)
// ============================================================
async function generateNamuna27(fy: string, village: VillageInfoType | null) {
  const voucherEntries = await safeQuery(() =>
    db.voucherEntry.findMany({ where: { financialYear: fy }, orderBy: { voucherDate: 'asc' } })
  );

  const rows = voucherEntries.map((v, i) => ({
    _sr: i + 1,
    voucherNo: v.voucherNo,
    date: v.voucherDate ? new Date(v.voucherDate).toLocaleDateString('en-IN') : '',
    voucherType: v.voucherType,
    amount: v.amount,
    debitAccount: v.debitAccount,
    creditAccount: v.creditAccount,
    narration: v.narration || '',
  }));

  return {
    ...makeBase(27, 'नमुना २७ - लेखापरीक्षण आक्षेप', 'Namuna 27 - Audit Objection', fy, village),
    headers: ['अ.क्र.', 'वाउचर क्र.', 'दिनांक', 'वाउचर प्रकार', 'रक्कम (₹)', 'नामे खाते', 'जमा खाते', 'निवेदन'],
    rows,
    totals: {
      totalVouchers: voucherEntries.length,
      एकूण_रक्कम: r2(voucherEntries.reduce((s, v) => s + v.amount, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 28 - मागासवर्गीय 15% व महिला बालकल्याण 10% (SC/Women welfare)
// ============================================================
async function generateNamuna28(fy: string, village: VillageInfoType | null) {
  const [budgetEntries, paymentEntries] = await Promise.all([
    safeQuery(() => db.budgetEntry.findMany({ where: { financialYear: fy, category: 'expenditure' } })),
    safeQuery(() => db.paymentEntry.findMany({ where: { financialYear: fy } })),
  ]);

  const totalExpenditure = paymentEntries.reduce((s, p) => s + p.amount, 0);
  const totalBudget = budgetEntries.reduce((s, b) => s + (b.revisedBudget || b.originalBudget), 0);

  const sc15 = r2(totalBudget * 0.15);
  const women10 = r2(totalBudget * 0.10);
  const scActual = r2(totalExpenditure * 0.15);
  const womenActual = r2(totalExpenditure * 0.10);

  const rows = [
    { _sr: 1, category: 'मागासवर्गीय 15%', budgetPercent: '15%', budgetAmount: sc15, actual: scActual, shortfall: r2(sc15 - scActual) },
    { _sr: 2, category: 'महिला बालकल्याण 10%', budgetPercent: '10%', budgetAmount: women10, actual: womenActual, shortfall: r2(women10 - womenActual) },
  ];

  return {
    ...makeBase(28, 'नमुना २८ - मागासवर्गीय 15% व महिला बालकल्याण 10%', 'Namuna 28 - SC/Women Welfare', fy, village),
    headers: ['अ.क्र.', 'श्रेणी', 'अंदाज टक्के', 'अंदाज रक्कम (₹)', 'वास्तव खर्च (₹)', 'तूट (₹)'],
    rows,
    totals: {
      totalBudget: r2(totalBudget),
      totalExpenditure: r2(totalExpenditure),
      scRequired: sc15,
      womenRequired: women10,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 29 - कर्जाची नोंदवही (Loan Register)
// ============================================================
async function generateNamuna29(fy: string, village: VillageInfoType | null) {
  const schemeInfos = await safeQuery(() =>
    db.schemeInfo.findMany({ where: { financialYear: fy, schemeType: 'loan' }, orderBy: { schemeName: 'asc' } })
  );

  // If no loan-type schemes, show all schemes as potential loan sources
  const entries = schemeInfos.length > 0 ? schemeInfos : await safeQuery(() =>
    db.schemeInfo.findMany({ where: { financialYear: fy }, orderBy: { schemeName: 'asc' } })
  );

  const rows = entries.map((s, i) => ({
    _sr: i + 1,
    schemeName: s.schemeNameMr || s.schemeName,
    schemeCode: s.schemeCode || '',
    department: s.department || '',
    grantAmount: s.grantAmount || 0,
    receivedAmount: s.receivedAmount,
    expenditure: s.expenditure,
    balance: s.balance,
    status: s.status,
  }));

  return {
    ...makeBase(29, 'नमुना २९ - कर्जाची नोंदवही', 'Namuna 29 - Loan Register', fy, village),
    headers: ['अ.क्र.', 'कर्ज नाव/योजना', 'कोड', 'विभाग', 'अनुदान रक्कम (₹)', 'प्राप्त रक्कम (₹)', 'खर्च (₹)', 'शिल्लक (₹)', 'स्थिती'],
    rows,
    totals: {
      totalLoans: entries.length,
      एकूण_अनुदान: r2(entries.reduce((s, e) => s + (e.grantAmount || 0), 0)),
      एकूण_प्राप्त: r2(entries.reduce((s, e) => s + e.receivedAmount, 0)),
      एकूण_खर्च: r2(entries.reduce((s, e) => s + e.expenditure, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 30 - लेखापरीक्षण पूर्तता (Audit Compliance)
// ============================================================
async function generateNamuna30(fy: string, village: VillageInfoType | null) {
  const voucherEntries = await safeQuery(() =>
    db.voucherEntry.findMany({ where: { financialYear: fy }, orderBy: { voucherDate: 'asc' } })
  );

  const rows = voucherEntries.map((v, i) => ({
    _sr: i + 1,
    voucherNo: v.voucherNo,
    date: v.voucherDate ? new Date(v.voucherDate).toLocaleDateString('en-IN') : '',
    voucherType: v.voucherType,
    amount: v.amount,
    debitAccount: v.debitAccount,
    creditAccount: v.creditAccount,
    narration: v.narration || '',
    complianceStatus: 'प्रलंबित',
  }));

  return {
    ...makeBase(30, 'नमुना ३० - लेखापरीक्षण पूर्तता', 'Namuna 30 - Audit Compliance', fy, village),
    headers: ['अ.क्र.', 'वाउचर क्र.', 'दिनांक', 'प्रकार', 'रक्कम (₹)', 'नामे खाते', 'जमा खाते', 'निवेदन', 'पूर्तता स्थिती'],
    rows,
    totals: {
      totalEntries: voucherEntries.length,
      एकूण_रक्कम: r2(voucherEntries.reduce((s, v) => s + v.amount, 0)),
      pendingCount: voucherEntries.length,
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 31 - प्रवास भत्ता देयक (Travel Allowance)
// ============================================================
async function generateNamuna31(fy: string, village: VillageInfoType | null) {
  const employees = await safeQuery(() => db.employeeMaster.findMany({ where: { isActive: true } }));

  const rows = employees.map((e, i) => ({
    _sr: i + 1,
    employeeName: e.employeeNameMr || e.employeeName,
    designation: e.designationMr || e.designation,
    department: e.department || '',
    basicPay: e.basicPay || 0,
    travelAllowance: r2((e.basicPay || 0) * 0.10), // 10% of basic as TA estimate
    dateOfJourney: '',
    fromPlace: '',
    toPlace: '',
    purpose: '',
  }));

  return {
    ...makeBase(31, 'नमुना ३१ - प्रवास भत्ता देयक', 'Namuna 31 - Travel Allowance Bill', fy, village),
    headers: ['अ.क्र.', 'कर्मचारी', 'पद', 'विभाग', 'मूळ वेतन (₹)', 'प्रवास भत्ता (₹)', 'प्रवास दिनांक', 'येथून', 'येथपर्यंत', 'हेतू'],
    rows,
    totals: {
      totalEmployees: employees.length,
      एकूण_प्रवास_भत्ता: r2(rows.reduce((s, r) => s + r.travelAllowance, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 32 - रकमेच्या परताव्यासाठीचा आदेश (Refund Order)
// ============================================================
async function generateNamuna32(fy: string, village: VillageInfoType | null) {
  const payments = await safeQuery(() =>
    db.taxPayment.findMany({
      where: { financialYear: fy },
      include: { property: { include: { ward: true, owners: { include: { owner: true } } } } },
      orderBy: { paymentDate: 'desc' },
    })
  );

  const rows = payments.map((p, i) => {
    const primaryOwner = p.property?.owners?.find(o => o.ownershipType === 'मालक') || p.property?.owners?.[0];
    return {
      _sr: i + 1,
      receiptNo: p.receiptNo,
      date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '',
      propertyNumber: p.property?.propertyNo || '',
      ownerName: primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : p.property?.ownerName || '',
      amountPaid: p.amountPaid,
      balance: p.balance,
      paymentMode: p.paymentMode,
      refundAmount: p.balance > 0 ? p.balance : 0,
    };
  });

  return {
    ...makeBase(32, 'नमुना ३२ - रकमेच्या परताव्यासाठीचा आदेश', 'Namuna 32 - Refund Order', fy, village),
    headers: ['अ.क्र.', 'पावती क्र.', 'दिनांक', 'मालमत्ता क्र.', 'मालक', 'भरलेले (₹)', 'शिल्लक (₹)', 'देयक पद्धत', 'परतावा (₹)'],
    rows,
    totals: {
      totalEntries: payments.length,
      एकूण_परतावा: r2(rows.reduce((s, r) => s + r.refundAmount, 0)),
    },
    meta: { financialYear: fy },
  };
}

// ============================================================
// NAMUNA 33 - वृक्ष नोंदवही (Tree Register) - Namuna33 model
// ============================================================
async function generateNamuna33(fy: string, village: VillageInfoType | null) {
  const entries = await safeQuery(() =>
    db.treeAsset.findMany({ where: { financialYear: fy }, orderBy: { treeType: 'asc' } })
  );

  const rows = entries.map((e, i) => ({
    _sr: i + 1,
    treeType: e.treeTypeMr || e.treeType,
    location: e.location || '',
    plantDate: e.plantDate || '',
    height: e.height || 0,
    girth: e.girth || 0,
    canopyDiameter: e.canopyDiameter || 0,
    condition: e.condition || '',
    estimatedValue: e.estimatedValue || 0,
    ownershipType: e.ownershipType || '',
    caretaker: e.caretaker || '',
    isProtected: e.isProtected ? 'होय' : 'नाही',
  }));

  return {
    ...makeBase(33, 'नमुना ३३ - वृक्ष नोंदवही', 'Namuna 33 - Tree Register', fy, village),
    headers: ['अ.क्र.', 'झाडाचा प्रकार', 'स्थान', 'लागवड दिनांक', 'उंची (मी)', 'घेर (मी)', 'छत्र व्यास (मी)', 'दर्जा', 'अंदाजित मूल्य (₹)', 'मालकी', 'रक्षक', 'संरक्षित'],
    rows,
    totals: {
      totalTrees: entries.length,
      एकूण_अंदाजित_मूल्य: r2(entries.reduce((s, e) => s + (e.estimatedValue || 0), 0)),
      protectedCount: entries.filter(e => e.isProtected).length,
    },
    meta: { financialYear: fy },
  };
}
