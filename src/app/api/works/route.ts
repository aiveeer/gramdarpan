import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - fetch work entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const financialYear = searchParams.get('financialYear');

    const where: Record<string, unknown> = {};
    if (financialYear) where.financialYear = financialYear;

    const records = await db.workEntry.findMany({
      where,
      include: { head: { select: { headName: true, headNameMr: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Works GET error:', error);
    return NextResponse.json([]);
  }
}

// POST - create / update / delete work entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ...data } = body;

    // Convert numeric fields
    if (data.estimatedCost !== undefined) data.estimatedCost = Number(data.estimatedCost) || 0;
    if (data.approvedCost !== undefined) data.approvedCost = Number(data.approvedCost) || 0;
    if (data.tenderAmount !== undefined) data.tenderAmount = Number(data.tenderAmount) || 0;
    if (data.progressPercent !== undefined) data.progressPercent = Number(data.progressPercent) || 0;
    // Handle headId empty string -> null
    if (data.headId === '' || data.headId === '__none__') data.headId = null;

    if (action === 'delete' && id) {
      await db.workEntry.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'update' && id) {
      const updated = await db.workEntry.update({
        where: { id },
        data,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Create
    const created = await db.workEntry.create({ data });
    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    console.error('Works POST error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ success: false, error: 'डुप्लिकेट रेकॉर्ड' }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : 'काम जतन करताना त्रुटी';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
