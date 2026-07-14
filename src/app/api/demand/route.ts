import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const financialYear = searchParams.get('financialYear');

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (financialYear) where.financialYear = financialYear;

    const records = await db.demandRegister.findMany({
      where,
      include: {
        property: {
          include: {
            ward: true,
            owner: true,
            owners: { include: { owner: true } },
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching demand register:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, data } = body;

    // Handle action-based format
    if (action === 'delete' && id) {
      await db.demandRegister.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    const recordData = action && data ? data : body;
    const recordId = action ? (id || recordData.id) : body.id;

    if (!recordData.propertyId || !recordData.financialYear) {
      return NextResponse.json({ success: false, error: 'मालमत्ता आणि आर्थिक वर्ष आवश्यक आहे' }, { status: 400 });
    }

    // Auto-calculate closing balance
    const ob = parseFloat(String(recordData.openingBalance || 0));
    const td = parseFloat(String(recordData.totalDemand || 0));
    const tc = parseFloat(String(recordData.totalCollection || 0));
    const pen = parseFloat(String(recordData.penalty || 0));
    const dis = parseFloat(String(recordData.discount || 0));
    const intr = parseFloat(String(recordData.interest || 0));

    const closingBalance = ob + td - tc + pen + intr - dis;

    const cleanData = {
      propertyId: recordData.propertyId,
      financialYear: recordData.financialYear,
      openingBalance: ob,
      totalDemand: td,
      totalCollection: tc,
      closingBalance: Math.round(closingBalance * 100) / 100,
      penalty: pen,
      discount: dis,
      currentTax: parseFloat(String(recordData.currentTax || 0)),
      previousBalance: parseFloat(String(recordData.previousBalance || 0)),
      interest: intr,
      remarks: recordData.remarks || null,
    };

    const includeConfig = {
      property: { include: { ward: true, owner: true, owners: { include: { owner: true } } } },
      payments: true,
    };

    let result;
    if (recordId) {
      result = await db.demandRegister.update({
        where: { id: recordId },
        data: cleanData,
        include: includeConfig,
      });
    } else {
      result = await db.demandRegister.create({
        data: cleanData,
        include: includeConfig,
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving demand register:', error);
    return NextResponse.json({ success: false, error: 'मागणी रजिस्टर जतन करण्यात अयशस्वी' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID आवश्यक आहे' }, { status: 400 });
    }
    await db.demandRegister.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting demand register:', error);
    return NextResponse.json({ success: false, error: 'मागणी रजिस्टर हटवण्यात अयशस्वी' }, { status: 500 });
  }
}
