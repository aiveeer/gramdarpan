import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - fetch schemes or fund entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // fund (default: schemes)
    const financialYear = searchParams.get('financialYear');

    const where: Record<string, unknown> = {};
    if (financialYear) where.financialYear = financialYear;

    if (type === 'fund') {
      const records = await db.schemeFundEntry.findMany({
        where,
        include: { scheme: { select: { schemeName: true, schemeNameMr: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(records);
    }

    // Default: schemes
    const records = await db.schemeInfo.findMany({
      where,
      orderBy: { schemeName: 'asc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Schemes GET error:', error);
    return NextResponse.json([]);
  }
}

// POST - create / update / delete schemes or fund entries
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // fund

    const body = await request.json();
    const { action, id, ...data } = body;

    // Handle schemeId empty string -> null
    if (data.schemeId === '' || data.schemeId === '__none__') data.schemeId = null;

    if (type === 'fund') {
      // Fund entries CRUD
      if (data.amount !== undefined) data.amount = Number(data.amount) || 0;

      if (action === 'delete' && id) {
        await db.schemeFundEntry.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      if (action === 'update' && id) {
        const updated = await db.schemeFundEntry.update({ where: { id }, data });
        return NextResponse.json({ success: true, data: updated });
      }

      // Create
      const created = await db.schemeFundEntry.create({ data });
      return NextResponse.json({ success: true, data: created });
    }

    // Schemes CRUD
    if (data.grantAmount !== undefined) data.grantAmount = Number(data.grantAmount) || 0;
    if (data.receivedAmount !== undefined) data.receivedAmount = Number(data.receivedAmount) || 0;
    if (data.expenditure !== undefined) data.expenditure = Number(data.expenditure) || 0;
    if (data.balance !== undefined) data.balance = Number(data.balance) || 0;

    if (action === 'delete' && id) {
      await db.schemeInfo.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'update' && id) {
      const updated = await db.schemeInfo.update({
        where: { id },
        data,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Create
    const created = await db.schemeInfo.create({ data });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Schemes POST error:', error);
    return NextResponse.json({ error: 'योजना जतन करताना त्रुटी' }, { status: 500 });
  }
}
