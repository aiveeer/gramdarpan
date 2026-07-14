import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - fetch transactions with type filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // receipt, payment, voucher
    const financialYear = searchParams.get('financialYear');
    const search = searchParams.get('search');
    const id = searchParams.get('id');

    if (!type) {
      // Return summary counts for all transaction types
      const fyFilter = financialYear ? { financialYear } : {};
      const [totalReceipts, totalPayments, totalVouchers] = await Promise.all([
        db.receiptEntry.count({ where: fyFilter }),
        db.paymentEntry.count({ where: fyFilter }),
        db.voucherEntry.count({ where: fyFilter }),
      ]);

      return NextResponse.json({
        success: true,
        data: { totalReceipts, totalPayments, totalVouchers },
      });
    }

    // Fetch by specific ID
    if (id) {
      let record;
      switch (type) {
        case 'receipt': record = await db.receiptEntry.findUnique({ where: { id } }); break;
        case 'payment': record = await db.paymentEntry.findUnique({ where: { id } }); break;
        case 'voucher': record = await db.voucherEntry.findUnique({ where: { id } }); break;
        default: return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: record });
    }

    // Build where clause
    const where: Record<string, unknown> = {};
    if (financialYear) where.financialYear = financialYear;
    if (search) {
      switch (type) {
        case 'receipt':
          where.OR = [
            { receiptNo: { contains: search } },
            { voucherNumber: { contains: search } },
            { receivedFrom: { contains: search } },
            { payerName: { contains: search } },
            { headOfAccount: { contains: search } },
            { description: { contains: search } },
          ];
          break;
        case 'payment':
          where.OR = [
            { voucherNo: { contains: search } },
            { payeeName: { contains: search } },
            { paidTo: { contains: search } },
            { headOfAccount: { contains: search } },
            { description: { contains: search } },
          ];
          break;
        case 'voucher':
          where.OR = [
            { voucherNo: { contains: search } },
            { debitAccount: { contains: search } },
            { creditAccount: { contains: search } },
            { narration: { contains: search } },
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
      case 'voucher':
        data = await db.voucherEntry.findMany({ where: where as Parameters<typeof db.voucherEntry.findMany>[0]['where'], orderBy });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST - create or update transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transactionType = body._type || body.type;
    if (!transactionType) {
      return NextResponse.json({ success: false, error: 'Type required' }, { status: 400 });
    }

    // Extract transaction type from body, keep everything else as data
    let data: Record<string, unknown>;
    if (body._type) {
      const { _type, ...rest } = body;
      data = rest;
    } else {
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
      voucher: ['amount'],
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
          if (!cleanData.receiptNo) cleanData.receiptNo = `RCP-${dateStr}-${random}`;
          if (!cleanData.voucherNumber) cleanData.voucherNumber = `RCP-VCH-${dateStr}-${random}`;
          if (!cleanData.receiptDate) cleanData.receiptDate = new Date();
          break;
        case 'payment':
          if (!cleanData.voucherNo) cleanData.voucherNo = `PAY-${dateStr}-${random}`;
          if (!cleanData.voucherDate) cleanData.voucherDate = new Date();
          break;
        case 'voucher':
          if (!cleanData.voucherNo) cleanData.voucherNo = `VCN-${dateStr}-${random}`;
          if (!cleanData.voucherDate) cleanData.voucherDate = new Date();
          break;
      }
    }

    // Convert date strings to Date objects
    if (cleanData.receiptDate && typeof cleanData.receiptDate === 'string') {
      cleanData.receiptDate = new Date(cleanData.receiptDate);
    }
    if (cleanData.voucherDate && typeof cleanData.voucherDate === 'string') {
      cleanData.voucherDate = new Date(cleanData.voucherDate);
    }

    let result;

    if (isUpdate && id) {
      switch (transactionType) {
        case 'receipt': result = await db.receiptEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.receiptEntry.update>[0]['data'] }); break;
        case 'payment': result = await db.paymentEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.paymentEntry.update>[0]['data'] }); break;
        case 'voucher': result = await db.voucherEntry.update({ where: { id }, data: cleanData as Parameters<typeof db.voucherEntry.update>[0]['data'] }); break;
        default: return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: result });
    }

    // Create
    switch (transactionType) {
      case 'receipt': result = await db.receiptEntry.create({ data: cleanData as Parameters<typeof db.receiptEntry.create>[0]['data'] }); break;
      case 'payment': result = await db.paymentEntry.create({ data: cleanData as Parameters<typeof db.paymentEntry.create>[0]['data'] }); break;
      case 'voucher': result = await db.voucherEntry.create({ data: cleanData as Parameters<typeof db.voucherEntry.create>[0]['data'] }); break;
      default: return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('Transactions POST error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ success: false, error: 'डुप्लिकेट रेकॉर्ड - हा क्रमांक आधीच अस्तित्वात आहे' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to save transaction' }, { status: 500 });
  }
}

// DELETE - delete transaction
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Type and ID required' }, { status: 400 });
    }

    switch (type) {
      case 'receipt': await db.receiptEntry.delete({ where: { id } }); break;
      case 'payment': await db.paymentEntry.delete({ where: { id } }); break;
      case 'voucher': await db.voucherEntry.delete({ where: { id } }); break;
      default: return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transactions DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete transaction' }, { status: 500 });
  }
}
