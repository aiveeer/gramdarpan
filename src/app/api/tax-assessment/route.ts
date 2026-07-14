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

    const records = await db.taxAssessment.findMany({
      where,
      include: {
        property: {
          include: {
            ward: true,
            owner: true,
            owners: { include: { owner: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching tax assessments:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, data } = body;

    // Handle action-based format: { action: 'create'|'update'|'delete', id?, data? }
    if (action === 'delete' && id) {
      await db.taxAssessment.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    const recordData = action && data ? data : body;
    const recordId = action ? (id || recordData.id) : body.id;

    if (!recordData.propertyId || !recordData.financialYear) {
      return NextResponse.json({ success: false, error: 'मालमत्ता आणि आर्थिक वर्ष आवश्यक आहे' }, { status: 400 });
    }

    // Auto-calculate totals
    const pt = parseFloat(String(recordData.propertyTax || 0));
    const wt = parseFloat(String(recordData.waterTax || 0));
    const lt = parseFloat(String(recordData.lightTax || 0));
    const prt = parseFloat(String(recordData.professionTax || 0));
    const mt = parseFloat(String(recordData.miscTax || 0));
    const con = parseFloat(String(recordData.concession || 0));

    const totalTax = pt + wt + lt + prt + mt;
    const netDemand = totalTax - con;

    const cleanData = {
      propertyId: recordData.propertyId,
      financialYear: recordData.financialYear,
      propertyTax: pt,
      waterTax: wt,
      lightTax: lt,
      professionTax: prt,
      miscTax: mt,
      totalTax: Math.round(totalTax * 100) / 100,
      concession: con,
      netDemand: Math.round(netDemand * 100) / 100,
      remarks: recordData.remarks || null,
      totalArea: parseFloat(String(recordData.totalArea || 0)),
      landRate: parseFloat(String(recordData.landRate || 0)),
      buildingRate: parseFloat(String(recordData.buildingRate || 0)),
      constructionRate: parseFloat(String(recordData.constructionRate || 0)),
      depreciationRate: parseFloat(String(recordData.depreciationRate || 0)),
      usageFactor: parseFloat(String(recordData.usageFactor || 1)),
      capitalValue: parseFloat(String(recordData.capitalValue || 0)),
      taxRatePercent: parseFloat(String(recordData.taxRatePercent || 0)),
      houseTaxAmt: parseFloat(String(recordData.houseTaxAmt || 0)),
      lightTaxAmt: parseFloat(String(recordData.lightTaxAmt || 0)),
      healthTaxAmt: parseFloat(String(recordData.healthTaxAmt || 0)),
      waterTaxAmt: parseFloat(String(recordData.waterTaxAmt || 0)),
    };

    const includeConfig = {
      property: { include: { ward: true, owner: true, owners: { include: { owner: true } } } },
    };

    let result;
    if (recordId) {
      result = await db.taxAssessment.update({
        where: { id: recordId },
        data: cleanData,
        include: includeConfig,
      });
    } else {
      result = await db.taxAssessment.create({
        data: cleanData,
        include: includeConfig,
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving tax assessment:', error);
    return NextResponse.json({ success: false, error: 'कर आकारणी जतन करण्यात अयशस्वी' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID आवश्यक आहे' }, { status: 400 });
    }
    await db.taxAssessment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tax assessment:', error);
    return NextResponse.json({ success: false, error: 'कर आकारणी हटवण्यात अयशस्वी' }, { status: 500 });
  }
}
