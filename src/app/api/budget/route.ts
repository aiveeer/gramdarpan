import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - fetch budget heads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const financialYear = searchParams.get('financialYear');

    const where: Record<string, unknown> = {};
    if (financialYear) where.financialYear = financialYear;

    const records = await db.budgetHead.findMany({
      where,
      orderBy: { headCode: 'asc' },
    });

    // Auto-calculate balance
    const result = records.map(r => ({
      ...r,
      balance: ((r.revisedAmount || r.budgetAmount) || 0) - (r.expenditure || 0),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Budget GET error:', error);
    return NextResponse.json([]);
  }
}

// POST - create / update / delete budget head
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ...data } = body;

    // Auto-calculate balance
    if (data.budgetAmount !== undefined || data.revisedAmount !== undefined || data.expenditure !== undefined) {
      const budgetAmt = Number(data.budgetAmount) || 0;
      const revisedAmt = data.revisedAmount !== undefined ? Number(data.revisedAmount) : undefined;
      const expend = Number(data.expenditure) || 0;
      data.balance = ((revisedAmt !== undefined ? revisedAmt : budgetAmt)) - expend;
      if (data.budgetAmount !== undefined) data.budgetAmount = budgetAmt;
      if (data.expenditure !== undefined) data.expenditure = expend;
      if (data.revisedAmount !== undefined) data.revisedAmount = revisedAmt;
    }

    if (action === 'delete' && id) {
      await db.budgetHead.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'update' && id) {
      const updated = await db.budgetHead.update({
        where: { id },
        data,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Create
    const created = await db.budgetHead.create({ data });
    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    console.error('Budget POST error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ success: false, error: 'डुप्लिकेट शिर्षक कोड - हा कोड आधीच अस्तित्वात आहे' }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : 'बजेट शिर्षक जतन करताना त्रुटी';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
