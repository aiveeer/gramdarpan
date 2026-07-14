import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - fetch salary entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const financialYear = searchParams.get('financialYear');

    const where: Record<string, unknown> = {};
    if (financialYear) where.financialYear = financialYear;

    const records = await db.salaryEntry.findMany({
      where,
      include: { employee: { select: { employeeName: true, employeeNameMr: true, designation: true, designationMr: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Salary GET error:', error);
    return NextResponse.json([]);
  }
}

// POST - create / update / delete salary entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ...data } = body;

    // Convert numeric fields
    if (data.basicPay !== undefined) data.basicPay = Number(data.basicPay) || 0;
    if (data.da !== undefined) data.da = Number(data.da) || 0;
    if (data.hra !== undefined) data.hra = Number(data.hra) || 0;
    if (data.ma !== undefined) data.ma = Number(data.ma) || 0;
    if (data.deductions !== undefined) data.deductions = Number(data.deductions) || 0;
    if (data.netPay !== undefined) data.netPay = Number(data.netPay) || 0;
    if (data.year !== undefined) data.year = Number(data.year) || new Date().getFullYear();

    if (action === 'delete' && id) {
      await db.salaryEntry.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'update' && id) {
      const updated = await db.salaryEntry.update({
        where: { id },
        data,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Create
    const created = await db.salaryEntry.create({ data });
    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    console.error('Salary POST error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ success: false, error: 'डुप्लिकेट रेकॉर्ड' }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : 'पगार जतन करताना त्रुटी';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
