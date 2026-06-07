import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const receiptNumber = searchParams.get('receiptNumber');

    if (receiptNumber) {
      const payment = await db.payment.findUnique({ where: { receiptNumber }, include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, namuna9: true } });
      if (!payment) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
      return NextResponse.json(payment);
    }

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;

    const payments = await db.payment.findMany({
      where,
      include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, namuna9: true },
      orderBy: { paymentDate: 'desc' },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { propertyId, namuna9Id, amountPaid, paymentMethod } = await request.json();
    if (!propertyId || !namuna9Id || !amountPaid) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const namuna9 = await db.namuna9.findUnique({ where: { id: namuna9Id }, include: { payments: true } });
    if (!namuna9) return NextResponse.json({ error: 'Namuna 9 not found' }, { status: 404 });

    const totalPaid = namuna9.payments.reduce((s: number, p: { amountPaid: number }) => s + p.amountPaid, 0);
    const balance = namuna9.totalDemand - totalPaid - amountPaid;

    if (balance < 0) return NextResponse.json({ error: 'Payment exceeds balance' }, { status: 400 });

    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const count = await db.payment.count();
    const receiptNumber = `RCP-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const payment = await db.payment.create({
      data: { propertyId, namuna9Id, amountPaid: parseFloat(amountPaid), balance: Math.round(balance * 100) / 100, receiptNumber, paymentMethod: paymentMethod || 'Cash', paymentDate: new Date() },
      include: { property: { include: { ward: true, owners: { include: { owner: true } } } }, namuna9: true },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
