import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - fetch bank accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const financialYear = searchParams.get('financialYear');

    const where: Record<string, unknown> = {};
    if (financialYear) where.financialYear = financialYear;

    const records = await db.bankAccount.findMany({
      where,
      orderBy: { bankName: 'asc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Bank GET error:', error);
    return NextResponse.json([]);
  }
}

// POST - create / update / delete bank account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ...data } = body;

    // Convert numeric fields
    if (data.balance !== undefined) data.balance = Number(data.balance) || 0;
    if (data.openingBalance !== undefined) data.openingBalance = Number(data.openingBalance) || 0;

    if (action === 'delete' && id) {
      await db.bankAccount.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'update' && id) {
      const updated = await db.bankAccount.update({
        where: { id },
        data,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Create
    const created = await db.bankAccount.create({ data });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Bank POST error:', error);
    return NextResponse.json({ error: 'बँक खाते जतन करताना त्रुटी' }, { status: 500 });
  }
}
