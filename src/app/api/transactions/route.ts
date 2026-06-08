import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - fetch transactions with type filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // receipt, payment, journal, asset, stock, schemeFund, waterBill, collection, budget, work, salary
    const financialYear = searchParams.get('financialYear');
    const search = searchParams.get('search');
    const id = searchParams.get('id');

    if (!type) {
      // Return summary counts for all transaction types
      const [totalReceipts, totalPayments, totalJournals, totalAssets, totalStock, totalSchemeFunds, totalWaterBills, totalCollections, totalBudgets, totalWorks, totalSalaries] = await Promise.all([
        db.receiptEntry.count({ where: financialYear ? { financialYear } : {} }),
        db.paymentEntry.count({ where: financialYear ? { financialYear } : {} }),
        db.journalEntry.count({ where: financialYear ? { financialYear } : {} }),
        db.assetEntry.count(),
        db.stockEntry.count(),
        db.schemeFundEntry.count({ where: financialYear ? { financialYear } : {} }),
        db.waterBillEntry.count({ where: financialYear ? { financialYear } : {} }),
        db.collectionEntry.count({ where: financialYear ? { financialYear } : {} }),
        db.budgetEntry.count({ where: financialYear ? { financialYear } : {} }),
        db.workEntry.count({ where: financialYear ? { financialYear } : {} }),
        db.salaryEntry.count({ where: financialYear ? { financialYear } : {} }),
      ]);

      return NextResponse.json({
        totalReceipts, totalPayments, totalJournals, totalAssets,
        totalStock, totalSchemeFunds, totalWaterBills, totalCollections,
        totalBudgets, totalWorks, totalSalaries,
      });
    }

    // Fetch by specific ID
    if (id) {
      let record;
      switch (type) {
        case 'receipt': record = await db.receiptEntry.findUnique({ where: { id } }); break;
        case 'payment': record = await db.paymentEntry.findUnique({ where: { id } }); break;
        case 'journal': record = await db.journalEntry.findUnique({ where: { id } }); break;
        case 'asset': record = await db.assetEntry.findUnique({ where: { id } }); break;
        case 'stock': record = await db.stockEntry.findUnique({ where: { id } }); break;
        case 'schemeFund': record = await db.schemeFundEntry.findUnique({ where: { id } }); break;
        case 'waterBill': record = await db.waterBillEntry.findUnique({ where: { id } }); break;
        case 'collection': record = await db.collectionEntry.findUnique({ where: { id } }); break;
        case 'budget': record = await db.budgetEntry.findUnique({ where: { id } }); break;
        case 'work': record = await db.workEntry.findUnique({ where: { id } }); break;
        case 'salary': record = await db.salaryEntry.findUnique({ where: { id } }); break;
        default: return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
      }
      return NextResponse.json(record);
    }

    // Build where clause
    const where: Record<string, unknown> = {};
    if (financialYear) where.financialYear = financialYear;
    if (search) {
      switch (type) {
        case 'receipt':
          where.OR = [
            { voucherNumber: { contains: search } },
            { receivedFrom: { contains: search } },
            { headOfAccount: { contains: search } },
            { description: { contains: search } },
          ];
          break;
        case 'payment':
          where.OR = [
            { voucherNumber: { contains: search } },
            { paidTo: { contains: search } },
            { headOfAccount: { contains: search } },
            { description: { contains: search } },
          ];
          break;
        case 'journal':
          where.OR = [
            { voucherNumber: { contains: search } },
            { debitAccount: { contains: search } },
            { creditAccount: { contains: search } },
            { description: { contains: search } },
          ];
          break;
        case 'asset':
          where.OR = [
            { assetNumber: { contains: search } },
            { assetName: { contains: search } },
            { assetType: { contains: search } },
            { location: { contains: search } },
          ];
          break;
        case 'stock':
          where.OR = [
            { stockNumber: { contains: search } },
            { itemName: { contains: search } },
            { category: { contains: search } },
          ];
          break;
        case 'schemeFund':
          where.OR = [
            { voucherNumber: { contains: search } },
            { description: { contains: search } },
          ];
          break;
        case 'waterBill':
          where.OR = [
            { billNumber: { contains: search } },
            { status: { contains: search } },
          ];
          break;
        case 'collection':
          where.OR = [
            { collectionNumber: { contains: search } },
            { collectionType: { contains: search } },
            { receiptNumber: { contains: search } },
          ];
          break;
        case 'budget':
          where.OR = [
            { budgetHeadCode: { contains: search } },
            { budgetHeadName: { contains: search } },
            { budgetHeadNameMr: { contains: search } },
            { category: { contains: search } },
            { type: { contains: search } },
            { description: { contains: search } },
          ];
          break;
        case 'work':
          where.OR = [
            { workNumber: { contains: search } },
            { workName: { contains: search } },
            { workNameMr: { contains: search } },
            { workType: { contains: search } },
            { status: { contains: search } },
            { description: { contains: search } },
          ];
          break;
        case 'salary':
          where.OR = [
            { employeeId: { contains: search } },
            { month: { contains: search } },
            { paymentMethod: { contains: search } },
            { status: { contains: search } },
          ];
          break;
      }
    }

    let data;
    const orderBy = { createdAt: 'desc' as const };

    switch (type) {
      case 'receipt':
        data = await db.receiptEntry.findMany({ where: where as Parameters<typeof db.receiptEntry.findMany>[0]['where'], orderBy });
        break;
      case 'payment':
        data = await db.paymentEntry.findMany({ where: where as Parameters<typeof db.paymentEntry.findMany>[0]['where'], orderBy });
        break;
      case 'journal':
        data = await db.journalEntry.findMany({ where: where as Parameters<typeof db.journalEntry.findMany>[0]['where'], orderBy });
        break;
      case 'asset':
        data = await db.assetEntry.findMany({ where: where as Parameters<typeof db.assetEntry.findMany>[0]['where'], orderBy });
        break;
      case 'stock':
        data = await db.stockEntry.findMany({ where: where as Parameters<typeof db.stockEntry.findMany>[0]['where'], orderBy });
        break;
      case 'schemeFund':
        data = await db.schemeFundEntry.findMany({ where: where as Parameters<typeof db.schemeFundEntry.findMany>[0]['where'], orderBy });
        break;
      case 'waterBill':
        data = await db.waterBillEntry.findMany({ where: where as Parameters<typeof db.waterBillEntry.findMany>[0]['where'], orderBy });
        break;
      case 'collection':
        data = await db.collectionEntry.findMany({ where: where as Parameters<typeof db.collectionEntry.findMany>[0]['where'], orderBy });
        break;
      case 'budget':
        data = await db.budgetEntry.findMany({ where: where as Parameters<typeof db.budgetEntry.findMany>[0]['where'], orderBy });
        break;
      case 'work':
        data = await db.workEntry.findMany({ where: where as Parameters<typeof db.workEntry.findMany>[0]['where'], orderBy });
        break;
      case 'salary':
        data = await db.salaryEntry.findMany({ where: where as Parameters<typeof db.salaryEntry.findMany>[0]['where'], orderBy });
        break;
      default:
        return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST - create or update transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Use _type for transaction type to avoid conflict with data fields like budget 'type'
    const transactionType = body._type || body.type;
    if (!transactionType) {
      return NextResponse.json({ error: 'Type required' }, { status: 400 });
    }

    // Extract transaction type from body, keep everything else as data
    let data: Record<string, unknown>;
    if (body._type) {
      const { _type, ...rest } = body;
      data = rest;
    } else {
      // Backward compatible: for old clients that send type at top level
      // Remove the transaction type key, but preserve any data field named 'type' (e.g., budget.type)
      // Since the old format doesn't have _type, we know 'type' in body is the transaction type
      const { type: _t, ...rest } = body;
      data = rest;
    }

    const isUpdate = !!data.id;
    const id = data.id as string | undefined;
    const { id: _id, ...createData } = data;

    // Convert numeric fields
    const numericFieldsMap: Record<string, string[]> = {
      receipt: ['amount'],
      payment: ['amount'],
      journal: ['amount'],
      asset: ['purchaseCost', 'currentValue', 'depreciationRate'],
      stock: ['quantity', 'unitPrice', 'totalValue'],
      schemeFund: ['amount'],
      waterBill: ['amount', 'penalty', 'totalAmount', 'paidAmount'],
      collection: ['amount'],
      budget: ['originalBudget', 'revisedBudget', 'actualAmount'],
      work: ['sanctionAmount', 'progressPercent', 'totalExpenditure'],
      salary: ['basicPay', 'da', 'hra', 'ta', 'ma', 'otherAllowance', 'grossSalary', 'pf', 'esi', 'tds', 'professionalTax', 'otherDeduction', 'totalDeduction', 'netSalary'],
    };

    const numericFields = numericFieldsMap[transactionType] || [];
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(createData)) {
      if (numericFields.includes(key)) {
        cleanData[key] = value ? parseFloat(String(value)) : 0;
      } else {
        cleanData[key] = value;
      }
    }

    // Auto-generate voucher/entry numbers if not provided
    if (!isUpdate) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

      switch (transactionType) {
        case 'receipt':
          if (!cleanData.voucherNumber) cleanData.voucherNumber = `RCP-${dateStr}-${random}`;
          break;
        case 'payment':
          if (!cleanData.voucherNumber) cleanData.voucherNumber = `PAY-${dateStr}-${random}`;
          break;
        case 'journal':
          if (!cleanData.voucherNumber) cleanData.voucherNumber = `JRN-${dateStr}-${random}`;
          break;
        case 'asset':
          if (!cleanData.assetNumber) cleanData.assetNumber = `AST-${dateStr}-${random}`;
          break;
        case 'stock':
          if (!cleanData.stockNumber) cleanData.stockNumber = `STK-${dateStr}-${random}`;
          // Auto-calculate total value
          const qty = Number(cleanData.quantity) || 0;
          const price = Number(cleanData.unitPrice) || 0;
          cleanData.totalValue = qty * price;
          break;
        case 'schemeFund':
          if (!cleanData.voucherNumber) cleanData.voucherNumber = `SCF-${dateStr}-${random}`;
          break;
        case 'waterBill':
          if (!cleanData.billNumber) cleanData.billNumber = `WBL-${dateStr}-${random}`;
          // Auto-calculate total amount
          const billAmt = Number(cleanData.amount) || 0;
          const penalty = Number(cleanData.penalty) || 0;
          cleanData.totalAmount = billAmt + penalty;
          break;
        case 'collection':
          if (!cleanData.collectionNumber) cleanData.collectionNumber = `COL-${dateStr}-${random}`;
          break;
        case 'budget':
          if (!cleanData.budgetEntryNumber) cleanData.budgetEntryNumber = `BGT-${dateStr}-${random}`;
          break;
        case 'work':
          if (!cleanData.workNumber) cleanData.workNumber = `WRK-${dateStr}-${random}`;
          break;
        case 'salary':
          if (!cleanData.salaryEntryNumber) cleanData.salaryEntryNumber = `SAL-${dateStr}-${random}`;
          // Auto-calculate salary components
          const basicPay = Number(cleanData.basicPay) || 0;
          const da = Number(cleanData.da) || 0;
          const hra = Number(cleanData.hra) || 0;
          const ta = Number(cleanData.ta) || 0;
          const ma = Number(cleanData.ma) || 0;
          const otherAllowance = Number(cleanData.otherAllowance) || 0;
          const pf = Number(cleanData.pf) || 0;
          const esi = Number(cleanData.esi) || 0;
          const tds = Number(cleanData.tds) || 0;
          const professionalTax = Number(cleanData.professionalTax) || 0;
          const otherDeduction = Number(cleanData.otherDeduction) || 0;

          cleanData.grossSalary = basicPay + da + hra + ta + ma + otherAllowance;
          cleanData.totalDeduction = pf + esi + tds + professionalTax + otherDeduction;
          cleanData.netSalary = cleanData.grossSalary - cleanData.totalDeduction;
          break;
      }
    }

    let result;

    if (isUpdate && id) {
      switch (transactionType) {
        case 'receipt': result = await db.receiptEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.receiptEntry.update>[0]['data'] }); break;
        case 'payment': result = await db.paymentEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.paymentEntry.update>[0]['data'] }); break;
        case 'journal': result = await db.journalEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.journalEntry.update>[0]['data'] }); break;
        case 'asset': result = await db.assetEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.assetEntry.update>[0]['data'] }); break;
        case 'stock': result = await db.stockEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.stockEntry.update>[0]['data'] }); break;
        case 'schemeFund': result = await db.schemeFundEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.schemeFundEntry.update>[0]['data'] }); break;
        case 'waterBill': result = await db.waterBillEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.waterBillEntry.update>[0]['data'] }); break;
        case 'collection': result = await db.collectionEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.collectionEntry.update>[0]['data'] }); break;
        case 'budget': result = await db.budgetEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.budgetEntry.update>[0]['data'] }); break;
        case 'work': result = await db.workEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.workEntry.update>[0]['data'] }); break;
        case 'salary': result = await db.salaryEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.salaryEntry.update>[0]['data'] }); break;
        default: return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
      }
      return NextResponse.json(result, { status: 200 });
    }

    // Create
    switch (transactionType) {
      case 'receipt': result = await db.receiptEntry.create({ data: cleanData as Parameters<typeof db.receiptEntry.create>[0]['data'] }); break;
      case 'payment': result = await db.paymentEntry.create({ data: cleanData as Parameters<typeof db.paymentEntry.create>[0]['data'] }); break;
      case 'journal': result = await db.journalEntry.create({ data: cleanData as Parameters<typeof db.journalEntry.create>[0]['data'] }); break;
      case 'asset': result = await db.assetEntry.create({ data: cleanData as Parameters<typeof db.assetEntry.create>[0]['data'] }); break;
      case 'stock': result = await db.stockEntry.create({ data: cleanData as Parameters<typeof db.stockEntry.create>[0]['data'] }); break;
      case 'schemeFund': result = await db.schemeFundEntry.create({ data: cleanData as Parameters<typeof db.schemeFundEntry.create>[0]['data'] }); break;
      case 'waterBill': result = await db.waterBillEntry.create({ data: cleanData as Parameters<typeof db.waterBillEntry.create>[0]['data'] }); break;
      case 'collection': result = await db.collectionEntry.create({ data: cleanData as Parameters<typeof db.collectionEntry.create>[0]['data'] }); break;
      case 'budget': result = await db.budgetEntry.create({ data: cleanData as Parameters<typeof db.budgetEntry.create>[0]['data'] }); break;
      case 'work': result = await db.workEntry.create({ data: cleanData as Parameters<typeof db.workEntry.create>[0]['data'] }); break;
      case 'salary': result = await db.salaryEntry.create({ data: cleanData as Parameters<typeof db.salaryEntry.create>[0]['data'] }); break;
      default: return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Transactions POST error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'डुप्लिकेट रेकॉर्ड - हा क्रमांक आधीच अस्तित्वात आहे' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 });
  }
}

// DELETE - delete transaction
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
    }

    switch (type) {
      case 'receipt': await db.receiptEntry.delete({ where: { id } }); break;
      case 'payment': await db.paymentEntry.delete({ where: { id } }); break;
      case 'journal': await db.journalEntry.delete({ where: { id } }); break;
      case 'asset': await db.assetEntry.delete({ where: { id } }); break;
      case 'stock': await db.stockEntry.delete({ where: { id } }); break;
      case 'schemeFund': await db.schemeFundEntry.delete({ where: { id } }); break;
      case 'waterBill': await db.waterBillEntry.delete({ where: { id } }); break;
      case 'collection': await db.collectionEntry.delete({ where: { id } }); break;
      case 'budget': await db.budgetEntry.delete({ where: { id } }); break;
      case 'work': await db.workEntry.delete({ where: { id } }); break;
      case 'salary': await db.salaryEntry.delete({ where: { id } }); break;
      default: return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Transactions DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
