import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const financialYear = searchParams.get('financialYear');
    const search = searchParams.get('search');

    if (search) {
      const properties = await db.propertyMaster.findMany({
        where: {
          OR: [
            { propertyNumber: { contains: search } },
            { owners: { some: { owner: { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }, { mobileNumber: { contains: search } }] } } } },
          ],
        },
        include: {
          ward: true,
          road: true,
          owners: { include: { owner: true } },
          namuna9s: { include: { payments: true } },
          taxRates: { include: { taxMaster: true } },
        },
      });

      const results = properties.map(p => {
        const totalPaid = p.payments.reduce((s, pm) => s + pm.amountPaid, 0);
        const totalDemand = p.namuna9s.reduce((s, n9) => s + n9.totalDemand, 0);
        return { ...p, totalPaid, totalDemand, outstandingBalance: totalDemand - totalPaid };
      });
      return NextResponse.json(results);
    }

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (financialYear) where.financialYear = financialYear;

    const records = await db.namuna9.findMany({
      where,
      include: {
        property: { include: { ward: true, road: true, owners: { include: { owner: true } } } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching Namuna 9:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { propertyId, financialYear, previousBalance, penalty, interest } = await request.json();
    if (!propertyId || !financialYear) {
      return NextResponse.json({ error: 'Property ID and Financial Year required' }, { status: 400 });
    }

    const namuna8 = await db.namuna8.findFirst({ where: { propertyId, financialYear } });
    const currentTax = namuna8 ? namuna8.totalTax : 0;

    if (!namuna8) {
      const property = await db.propertyMaster.findUnique({
        where: { id: propertyId },
        include: { taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } } },
      });
      if (property) {
        let calcTax = 0;
        for (const tr of property.taxRates) {
          if (tr.taxMaster.isEnabled) calcTax += (property.area || 0) * tr.rate;
        }
        const totalDemand = calcTax + (previousBalance || 0) + (penalty || 0) + (interest || 0);
        const existing = await db.namuna9.findFirst({ where: { propertyId, financialYear } });
        if (existing) {
          return NextResponse.json(await db.namuna9.update({ where: { id: existing.id }, data: { currentTax: Math.round(calcTax * 100) / 100, previousBalance: previousBalance || 0, penalty: penalty || 0, interest: interest || 0, totalDemand: Math.round(totalDemand * 100) / 100 }, include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, payments: true } }));
        }
        return NextResponse.json(await db.namuna9.create({ data: { propertyId, financialYear, currentTax: Math.round(calcTax * 100) / 100, previousBalance: previousBalance || 0, penalty: penalty || 0, interest: interest || 0, totalDemand: Math.round(totalDemand * 100) / 100 }, include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, payments: true } }), { status: 201 });
      }
    }

    const totalDemand = currentTax + (previousBalance || 0) + (penalty || 0) + (interest || 0);
    const existing = await db.namuna9.findFirst({ where: { propertyId, financialYear } });
    if (existing) {
      return NextResponse.json(await db.namuna9.update({ where: { id: existing.id }, data: { currentTax, previousBalance: previousBalance || 0, penalty: penalty || 0, interest: interest || 0, totalDemand: Math.round(totalDemand * 100) / 100 }, include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, payments: true } }));
    }

    return NextResponse.json(
      await db.namuna9.create({ data: { propertyId, financialYear, currentTax, previousBalance: previousBalance || 0, penalty: penalty || 0, interest: interest || 0, totalDemand: Math.round(totalDemand * 100) / 100 }, include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, payments: true } }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating Namuna 9:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
