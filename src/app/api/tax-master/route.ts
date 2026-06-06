import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET all tax masters
export async function GET() {
  try {
    const taxes = await db.taxMaster.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(taxes);
  } catch (error) {
    console.error('Error fetching tax masters:', error);
    return NextResponse.json({ error: 'Failed to fetch tax masters' }, { status: 500 });
  }
}

// POST create or update tax master
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'seed') {
      // Seed default taxes
      const defaultTaxes = [
        { name: 'House Tax', nameMarathi: 'गृहकर', rate: 10, isEnabled: true, order: 1 },
        { name: 'Water Tax', nameMarathi: 'पाणीकर', rate: 5, isEnabled: true, order: 2 },
        { name: 'Light Tax', nameMarathi: 'दिवाबती कर', rate: 5, isEnabled: true, order: 3 },
        { name: 'Health Tax', nameMarathi: 'आरोग्य कर', rate: 3, isEnabled: true, order: 4 },
        { name: 'Education Tax', nameMarathi: 'शिक्षण कर', rate: 2, isEnabled: true, order: 5 },
        { name: 'Tree Tax', nameMarathi: 'वृक्ष कर', rate: 1, isEnabled: true, order: 6 },
        { name: 'Employment Tax', nameMarathi: 'रोजगार कर', rate: 2, isEnabled: true, order: 7 },
        { name: 'Drainage Tax', nameMarathi: 'नाला कर', rate: 3, isEnabled: true, order: 8 },
        { name: 'Sanitation Tax', nameMarathi: 'स्वच्छता कर', rate: 3, isEnabled: true, order: 9 },
        { name: 'Fire Tax', nameMarathi: 'अग्निशामक कर', rate: 1, isEnabled: true, order: 10 },
        { name: 'Special Tax', nameMarathi: 'विशेष कर', rate: 2, isEnabled: false, order: 11 },
        { name: 'Penalty', nameMarathi: 'दंड', rate: 0, isEnabled: true, order: 12 },
        { name: 'Interest', nameMarathi: 'व्याज', rate: 0, isEnabled: true, order: 13 },
        { name: 'Other Charges', nameMarathi: 'इतर आकारणी', rate: 0, isEnabled: false, order: 14 },
      ];

      const existing = await db.taxMaster.count();
      if (existing > 0) {
        return NextResponse.json({ message: 'Tax masters already seeded', count: existing });
      }

      const created = await db.taxMaster.createMany({ data: defaultTaxes });
      return NextResponse.json({ message: 'Tax masters seeded', count: created.count });
    }

    if (body.action === 'bulkUpdate') {
      // Bulk update tax masters
      const { taxes } = body as { taxes: { id: string; rate: number; isEnabled: boolean; nameMarathi: string }[] };
      const results = [];
      for (const tax of taxes) {
        const updated = await db.taxMaster.update({
          where: { id: tax.id },
          data: { rate: tax.rate, isEnabled: tax.isEnabled, nameMarathi: tax.nameMarathi },
        });
        results.push(updated);
      }
      return NextResponse.json(results);
    }

    // Create new tax
    const tax = await db.taxMaster.create({
      data: {
        name: body.name,
        nameMarathi: body.nameMarathi,
        rate: body.rate || 0,
        isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
        order: body.order || 0,
      },
    });
    return NextResponse.json(tax, { status: 201 });
  } catch (error) {
    console.error('Error creating tax master:', error);
    return NextResponse.json({ error: 'Failed to create tax master' }, { status: 500 });
  }
}

// PUT update tax master
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const tax = await db.taxMaster.update({
      where: { id: body.id },
      data: {
        name: body.name,
        nameMarathi: body.nameMarathi,
        rate: body.rate,
        isEnabled: body.isEnabled,
        order: body.order,
      },
    });
    return NextResponse.json(tax);
  } catch (error) {
    console.error('Error updating tax master:', error);
    return NextResponse.json({ error: 'Failed to update tax master' }, { status: 500 });
  }
}

// DELETE tax master
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    await db.taxMaster.delete({ where: { id } });
    return NextResponse.json({ message: 'Tax master deleted' });
  } catch (error) {
    console.error('Error deleting tax master:', error);
    return NextResponse.json({ error: 'Failed to delete tax master' }, { status: 500 });
  }
}
