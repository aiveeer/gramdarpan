import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET Namuna 8 records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const financialYear = searchParams.get('financialYear');

    if (propertyId) {
      const where: Record<string, unknown> = { propertyId };
      if (financialYear) where.financialYear = financialYear;

      const records = await db.namuna8.findMany({
        where,
        include: {
          property: {
            include: {
              taxRates: {
                include: { taxMaster: true },
                orderBy: { taxMaster: { order: 'asc' } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(records);
    }

    const records = await db.namuna8.findMany({
      include: {
        property: {
          include: {
            taxRates: {
              include: { taxMaster: true },
              orderBy: { taxMaster: { order: 'asc' } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching Namuna 8:', error);
    return NextResponse.json({ error: 'Failed to fetch Namuna 8' }, { status: 500 });
  }
}

// POST Generate Namuna 8
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, financialYear } = body;

    if (!propertyId || !financialYear) {
      return NextResponse.json({ error: 'Property ID and Financial Year are required' }, { status: 400 });
    }

    // Fetch property with tax rates
    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        taxRates: {
          include: { taxMaster: true },
          orderBy: { taxMaster: { order: 'asc' } },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Calculate taxes
    const taxDetails: {
      taxMasterId: string;
      taxName: string;
      taxNameMarathi: string;
      rate: number;
      amount: number;
    }[] = [];
    let totalTax = 0;

    for (const tr of property.taxRates) {
      const amount = (property.area || 0) * tr.rate;
      taxDetails.push({
        taxMasterId: tr.taxMasterId,
        taxName: tr.taxMaster.name,
        taxNameMarathi: tr.taxMaster.nameMarathi,
        rate: tr.rate,
        amount: Math.round(amount * 100) / 100,
      });
      totalTax += amount;
    }

    // Check if Namuna 8 already exists for this property and year
    const existing = await db.namuna8.findFirst({
      where: { propertyId, financialYear },
    });

    if (existing) {
      // Update existing
      const updated = await db.namuna8.update({
        where: { id: existing.id },
        data: {
          taxDetails: JSON.stringify(taxDetails),
          totalTax: Math.round(totalTax * 100) / 100,
        },
        include: { property: true },
      });
      return NextResponse.json(updated);
    }

    // Create new Namuna 8
    const namuna8 = await db.namuna8.create({
      data: {
        propertyId,
        financialYear,
        taxDetails: JSON.stringify(taxDetails),
        totalTax: Math.round(totalTax * 100) / 100,
      },
      include: { property: true },
    });

    return NextResponse.json(namuna8, { status: 201 });
  } catch (error) {
    console.error('Error generating Namuna 8:', error);
    return NextResponse.json({ error: 'Failed to generate Namuna 8' }, { status: 500 });
  }
}
