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

    const records = await db.namuna8.findMany({
      where,
      include: {
        property: {
          include: {
            ward: true,
            road: true,
            owners: { include: { owner: true } },
            taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching Namuna 8:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { propertyId, financialYear } = await request.json();
    if (!propertyId || !financialYear) {
      return NextResponse.json({ error: 'Property ID and Financial Year required' }, { status: 400 });
    }

    const property = await db.propertyMaster.findUnique({
      where: { id: propertyId },
      include: {
        ward: true,
        road: true,
        owners: { include: { owner: true } },
        taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } },
      },
    });

    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    const taxDetails: { taxMasterId: string; taxName: string; taxNameMarathi: string; rate: number; amount: number }[] = [];
    let totalTax = 0;

    for (const tr of property.taxRates) {
      if (!tr.taxMaster.isEnabled) continue;
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

    // Check Ready Reckoner for additional calculation
    const readyReckoner = await db.readyReckonerMaster.findFirst({
      where: {
        usageType: property.usageType || '',
        constructionType: property.constructionType || '',
        year: financialYear,
      },
    });

    const existing = await db.namuna8.findFirst({ where: { propertyId, financialYear } });

    const recordData = {
      taxDetails: JSON.stringify(taxDetails),
      totalTax: Math.round(totalTax * 100) / 100,
    };

    if (existing) {
      return NextResponse.json(await db.namuna8.update({ where: { id: existing.id }, data: recordData, include: { property: { include: { ward: true, owners: { include: { owner: true } } } } } }));
    }

    return NextResponse.json(
      await db.namuna8.create({
        data: { propertyId, financialYear, ...recordData },
        include: { property: { include: { ward: true, owners: { include: { owner: true } } } } },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating Namuna 8:', error);
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}
