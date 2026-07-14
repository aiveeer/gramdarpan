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

    const records = await db.taxPayment.findMany({
      where,
      include: {
        property: {
          include: {
            ward: true,
            owner: true,
            owners: { include: { owner: true } },
          },
        },
        demand: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching tax payments:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, data } = body;

    // Handle action-based format
    if (action === 'delete' && id) {
      await db.taxPayment.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    const recordData = action && data ? data : body;
    const recordId = action ? (id || recordData.id) : body.id;

    if (!recordData.propertyId || !recordData.financialYear) {
      return NextResponse.json({ success: false, error: 'मालमत्ता आणि आर्थिक वर्ष आवश्यक आहे' }, { status: 400 });
    }

    const amt = parseFloat(String(recordData.amount || 0));
    const amtPaid = parseFloat(String(recordData.amountPaid || 0));
    const td = parseFloat(String(recordData.totalDemand || 0));
    const balance = td - amtPaid;

    // Auto-generate receipt number if not provided
    let finalReceiptNo = recordData.receiptNo;
    if (!finalReceiptNo) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const count = await db.taxPayment.count();
      finalReceiptNo = `RCP-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    }

    const cleanData = {
      propertyId: recordData.propertyId,
      receiptNo: finalReceiptNo,
      financialYear: recordData.financialYear,
      amount: amt,
      amountPaid: amtPaid,
      totalDemand: td,
      balance: Math.round(balance * 100) / 100,
      paymentDate: recordData.paymentDate ? new Date(recordData.paymentDate) : new Date(),
      paymentMode: recordData.paymentMode || 'cash',
      chequeNo: recordData.chequeNo || null,
      bankName: recordData.bankName || null,
      collectedBy: recordData.collectedBy || null,
      remarks: recordData.remarks || null,
      demandId: recordData.demandId || null,
    };

    const includeConfig = {
      property: { include: { ward: true, owner: true, owners: { include: { owner: true } } } },
      demand: true,
    };

    let result;
    if (recordId) {
      // Update - don't change receiptNo on update
      const { receiptNo: _rn, ...updateData } = cleanData;
      result = await db.taxPayment.update({
        where: { id: recordId },
        data: updateData,
        include: includeConfig,
      });
    } else {
      result = await db.taxPayment.create({
        data: cleanData,
        include: includeConfig,
      });
    }

    // Update the demand register's totalCollection if demandId exists
    if (cleanData.demandId) {
      const allPayments = await db.taxPayment.findMany({
        where: { demandId: cleanData.demandId },
      });
      const totalCollection = allPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const demand = await db.demandRegister.findUnique({ where: { id: cleanData.demandId } });
      if (demand) {
        const closingBalance = demand.openingBalance + demand.totalDemand - totalCollection + demand.penalty + demand.interest - demand.discount;
        await db.demandRegister.update({
          where: { id: cleanData.demandId },
          data: {
            totalCollection: Math.round(totalCollection * 100) / 100,
            closingBalance: Math.round(closingBalance * 100) / 100,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving tax payment:', error);
    return NextResponse.json({ success: false, error: 'कर वसूल जतन करण्यात अयशस्वी' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID आवश्यक आहे' }, { status: 400 });
    }
    await db.taxPayment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tax payment:', error);
    return NextResponse.json({ success: false, error: 'कर वसूल हटवण्यात अयशस्वी' }, { status: 500 });
  }
}
