import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET all tax masters
export async function GET() {
  try {
    const taxes = await db.taxMaster.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ success: true, data: taxes });
  } catch (error) {
    console.error('Error fetching tax masters:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tax masters' }, { status: 500 });
  }
}

// POST create or update tax master
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'seed') {
      // Seed default taxes
      const defaultTaxes = [
        { taxName: 'House Tax', taxNameMr: 'गृहकर', taxType: 'general', taxRate: 10, isEnabled: true, order: 1 },
        { taxName: 'Water Tax', taxNameMr: 'पाणीकर', taxType: 'general', taxRate: 5, isEnabled: true, order: 2 },
        { taxName: 'Light Tax', taxNameMr: 'दिवाबती कर', taxType: 'general', taxRate: 5, isEnabled: true, order: 3 },
        { taxName: 'Health Tax', taxNameMr: 'आरोग्य कर', taxType: 'general', taxRate: 3, isEnabled: true, order: 4 },
        { taxName: 'Education Tax', taxNameMr: 'शिक्षण कर', taxType: 'general', taxRate: 2, isEnabled: true, order: 5 },
        { taxName: 'Tree Tax', taxNameMr: 'वृक्ष कर', taxType: 'general', taxRate: 1, isEnabled: true, order: 6 },
        { taxName: 'Employment Tax', taxNameMr: 'रोजगार कर', taxType: 'general', taxRate: 2, isEnabled: true, order: 7 },
        { taxName: 'Drainage Tax', taxNameMr: 'नाला कर', taxType: 'general', taxRate: 3, isEnabled: true, order: 8 },
        { taxName: 'Sanitation Tax', taxNameMr: 'स्वच्छता कर', taxType: 'general', taxRate: 3, isEnabled: true, order: 9 },
        { taxName: 'Fire Tax', taxNameMr: 'अग्निशामक कर', taxType: 'general', taxRate: 1, isEnabled: true, order: 10 },
        { taxName: 'Special Tax', taxNameMr: 'विशेष कर', taxType: 'general', taxRate: 2, isEnabled: false, order: 11 },
        { taxName: 'Penalty', taxNameMr: 'दंड', taxType: 'penalty', taxRate: 0, isEnabled: true, order: 12 },
        { taxName: 'Interest', taxNameMr: 'व्याज', taxType: 'interest', taxRate: 0, isEnabled: true, order: 13 },
      ];

      const existing = await db.taxMaster.count();
      if (existing > 0) {
        return NextResponse.json({ success: true, data: { message: 'Tax masters already seeded', count: existing } });
      }

      const created = await db.taxMaster.createMany({ data: defaultTaxes });
      return NextResponse.json({ success: true, data: { message: 'Tax masters seeded', count: created.count } });
    }

    if (body.action === 'bulkUpdate') {
      const { taxes } = body as { taxes: { id: string; taxRate: number; isEnabled: boolean; taxNameMr: string }[] };
      const results = [];
      for (const tax of taxes) {
        const updated = await db.taxMaster.update({
          where: { id: tax.id },
          data: { taxRate: tax.taxRate, isEnabled: tax.isEnabled, taxNameMr: tax.taxNameMr },
        });
        results.push(updated);
      }
      return NextResponse.json({ success: true, data: results });
    }

    // Create new tax
    const tax = await db.taxMaster.create({
      data: {
        taxName: body.taxName,
        taxNameMr: body.taxNameMr || body.taxName,
        taxType: body.taxType || 'general',
        taxRate: body.taxRate || 0,
        isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
        order: body.order || 0,
      },
    });
    return NextResponse.json({ success: true, data: tax });
  } catch (error) {
    console.error('Error creating tax master:', error);
    return NextResponse.json({ success: false, error: 'Failed to create tax master' }, { status: 500 });
  }
}

// PUT update tax master
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const tax = await db.taxMaster.update({
      where: { id: body.id },
      data: {
        taxName: body.taxName,
        taxNameMr: body.taxNameMr,
        taxType: body.taxType,
        taxRate: body.taxRate,
        isEnabled: body.isEnabled,
        order: body.order,
      },
    });
    return NextResponse.json({ success: true, data: tax });
  } catch (error) {
    console.error('Error updating tax master:', error);
    return NextResponse.json({ success: false, error: 'Failed to update tax master' }, { status: 500 });
  }
}

// DELETE tax master
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    await db.taxMaster.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tax master:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete tax master' }, { status: 500 });
  }
}
