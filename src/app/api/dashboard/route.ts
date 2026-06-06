import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET dashboard statistics
export async function GET() {
  try {
    const totalProperties = await db.property.count();
    const totalTaxMasters = await db.taxMaster.count();
    const enabledTaxMasters = await db.taxMaster.count({ where: { isEnabled: true } });
    const totalNamuna8 = await db.namuna8.count();
    const totalNamuna9 = await db.namuna9.count();
    const totalPayments = await db.payment.count();

    const totalDemandResult = await db.namuna9.aggregate({
      _sum: { totalDemand: true },
    });

    const totalPaidResult = await db.payment.aggregate({
      _sum: { amountPaid: true },
    });

    const totalDemand = totalDemandResult._sum.totalDemand || 0;
    const totalPaid = totalPaidResult._sum.amountPaid || 0;

    return NextResponse.json({
      totalProperties,
      totalTaxMasters,
      enabledTaxMasters,
      totalNamuna8,
      totalNamuna9,
      totalPayments,
      totalDemand: Math.round(totalDemand * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstandingBalance: Math.round((totalDemand - totalPaid) * 100) / 100,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
