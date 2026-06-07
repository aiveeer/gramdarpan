import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [totalProperties, totalTaxMasters, enabledTaxMasters, totalNamuna8, totalNamuna9, totalPayments, totalWards, totalOwners, totalRoads, totalEmployees] = await Promise.all([
      db.propertyMaster.count(),
      db.taxMaster.count(),
      db.taxMaster.count({ where: { isEnabled: true } }),
      db.namuna8.count(),
      db.namuna9.count(),
      db.payment.count(),
      db.wardMaster.count(),
      db.ownerMaster.count(),
      db.roadMaster.count(),
      db.employeeMaster.count(),
    ]);

    const [{ _sum: demandSum }, { _sum: paidSum }] = await Promise.all([
      db.namuna9.aggregate({ _sum: { totalDemand: true } }),
      db.payment.aggregate({ _sum: { amountPaid: true } }),
    ]);

    const totalDemand = demandSum.totalDemand || 0;
    const totalPaid = paidSum.amountPaid || 0;

    return NextResponse.json({
      totalProperties, totalTaxMasters, enabledTaxMasters, totalNamuna8, totalNamuna9, totalPayments,
      totalWards, totalOwners, totalRoads, totalEmployees,
      totalDemand: Math.round(totalDemand * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstandingBalance: Math.round((totalDemand - totalPaid) * 100) / 100,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
