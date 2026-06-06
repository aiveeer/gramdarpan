import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET Namuna 9 records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const financialYear = searchParams.get('financialYear');
    const search = searchParams.get('search');

    if (search) {
      // Search by property number, owner name, or mobile
      const properties = await db.property.findMany({
        where: {
          OR: [
            { propertyNumber: { contains: search } },
            { ownerName: { contains: search } },
            { mobileNumber: { contains: search } },
          ],
        },
        include: {
          namuna9s: {
            include: { payments: true },
            orderBy: { createdAt: 'desc' },
          },
          taxRates: {
            include: { taxMaster: true },
            orderBy: { taxMaster: { order: 'asc' } },
          },
        },
      });

      // Calculate balances for each property
      const results = properties.map(p => {
        const totalPaid = p.payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
        const totalDemand = p.namuna9s.reduce((sum, n9) => sum + n9.totalDemand, 0);
        return {
          ...p,
          totalPaid,
          totalDemand,
          outstandingBalance: totalDemand - totalPaid,
        };
      });

      return NextResponse.json(results);
    }

    if (propertyId) {
      const where: Record<string, unknown> = { propertyId };
      if (financialYear) where.financialYear = financialYear;

      const records = await db.namuna9.findMany({
        where,
        include: {
          property: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(records);
    }

    const records = await db.namuna9.findMany({
      include: {
        property: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching Namuna 9:', error);
    return NextResponse.json({ error: 'Failed to fetch Namuna 9' }, { status: 500 });
  }
}

// POST Generate Namuna 9 (Demand Register)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, financialYear, previousBalance, penalty } = body;

    if (!propertyId || !financialYear) {
      return NextResponse.json({ error: 'Property ID and Financial Year are required' }, { status: 400 });
    }

    // Fetch Namuna 8 for current tax
    const namuna8 = await db.namuna8.findFirst({
      where: { propertyId, financialYear },
    });

    const currentTax = namuna8 ? namuna8.totalTax : 0;

    // If no Namuna 8, try to calculate from property tax rates
    if (!namuna8) {
      const property = await db.property.findUnique({
        where: { id: propertyId },
        include: {
          taxRates: {
            include: { taxMaster: true },
            orderBy: { taxMaster: { order: 'asc' } },
          },
        },
      });

      if (property) {
        let calculatedTax = 0;
        for (const tr of property.taxRates) {
          calculatedTax += (property.area || 0) * tr.rate;
        }
        const totalDemand = calculatedTax + (previousBalance || 0) + (penalty || 0);

        // Check if Namuna 9 already exists
        const existing = await db.namuna9.findFirst({
          where: { propertyId, financialYear },
        });

        if (existing) {
          const updated = await db.namuna9.update({
            where: { id: existing.id },
            data: {
              currentTax: Math.round(calculatedTax * 100) / 100,
              previousBalance: previousBalance || 0,
              penalty: penalty || 0,
              totalDemand: Math.round(totalDemand * 100) / 100,
            },
            include: { property: true, payments: true },
          });
          return NextResponse.json(updated);
        }

        const namuna9 = await db.namuna9.create({
          data: {
            propertyId,
            financialYear,
            currentTax: Math.round(calculatedTax * 100) / 100,
            previousBalance: previousBalance || 0,
            penalty: penalty || 0,
            totalDemand: Math.round(totalDemand * 100) / 100,
          },
          include: { property: true, payments: true },
        });
        return NextResponse.json(namuna9, { status: 201 });
      }
    }

    const totalDemand = currentTax + (previousBalance || 0) + (penalty || 0);

    // Check if Namuna 9 already exists
    const existingN9 = await db.namuna9.findFirst({
      where: { propertyId, financialYear },
    });

    if (existingN9) {
      const updated = await db.namuna9.update({
        where: { id: existingN9.id },
        data: {
          currentTax,
          previousBalance: previousBalance || 0,
          penalty: penalty || 0,
          totalDemand: Math.round(totalDemand * 100) / 100,
        },
        include: { property: true, payments: true },
      });
      return NextResponse.json(updated);
    }

    const namuna9 = await db.namuna9.create({
      data: {
        propertyId,
        financialYear,
        currentTax,
        previousBalance: previousBalance || 0,
        penalty: penalty || 0,
        totalDemand: Math.round(totalDemand * 100) / 100,
      },
      include: { property: true, payments: true },
    });

    return NextResponse.json(namuna9, { status: 201 });
  } catch (error) {
    console.error('Error generating Namuna 9:', error);
    return NextResponse.json({ error: 'Failed to generate Namuna 9' }, { status: 500 });
  }
}
