import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET payments / receipts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const namuna9Id = searchParams.get('namuna9Id');
    const receiptNumber = searchParams.get('receiptNumber');

    if (receiptNumber) {
      const payment = await db.payment.findUnique({
        where: { receiptNumber },
        include: {
          property: true,
          namuna9: true,
        },
      });
      if (!payment) {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
      }
      return NextResponse.json(payment);
    }

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (namuna9Id) where.namuna9Id = namuna9Id;

    const payments = await db.payment.findMany({
      where,
      include: {
        property: true,
        namuna9: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST Create payment (Namuna 9-Ka Receipt)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, namuna9Id, amountPaid, paymentMethod } = body;

    if (!propertyId || !namuna9Id || !amountPaid) {
      return NextResponse.json({ error: 'Property ID, Namuna 9 ID, and Amount are required' }, { status: 400 });
    }

    // Fetch the Namuna 9 record
    const namuna9 = await db.namuna9.findUnique({
      where: { id: namuna9Id },
      include: { payments: true },
    });

    if (!namuna9) {
      return NextResponse.json({ error: 'Namuna 9 not found' }, { status: 404 });
    }

    // Calculate total paid so far
    const totalPaid = namuna9.payments.reduce((sum: number, p: { amountPaid: number }) => sum + p.amountPaid, 0);
    const balance = namuna9.totalDemand - totalPaid - amountPaid;

    if (balance < 0) {
      return NextResponse.json({ error: 'Payment amount exceeds outstanding balance' }, { status: 400 });
    }

    // Generate receipt number
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const count = await db.payment.count();
    const receiptNumber = `RCP-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const payment = await db.payment.create({
      data: {
        propertyId,
        namuna9Id,
        amountPaid: parseFloat(amountPaid),
        balance: Math.round(balance * 100) / 100,
        receiptNumber,
        paymentMethod: paymentMethod || 'Cash',
        paymentDate: new Date(),
      },
      include: {
        property: true,
        namuna9: true,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
