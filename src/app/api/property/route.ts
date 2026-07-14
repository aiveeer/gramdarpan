import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET all properties or search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const id = searchParams.get('id');

    if (id) {
      const property = await db.propertyMaster.findUnique({
        where: { id },
        include: {
          ward: true,
          road: true,
          owner: true,
          owners: { include: { owner: true } },
          taxRates: {
            include: { taxMaster: true },
            orderBy: { taxMaster: { order: 'asc' } },
          },
        },
      });
      if (!property) {
        return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: property });
    }

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { propertyNo: { contains: search } },
        { ownerName: { contains: search } },
        { citySurveyNo: { contains: search } },
      ];
    }

    const properties = await db.propertyMaster.findMany({
      where,
      include: {
        ward: true,
        road: true,
        owner: true,
        owners: { include: { owner: true } },
        taxRates: {
          include: { taxMaster: true },
          orderBy: { taxMaster: { order: 'asc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: properties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch properties' }, { status: 500 });
  }
}

// POST create property
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owners, taxRates, ...propertyData } = body;

    const numericFields = ['areaSqFt', 'builtUpArea', 'houseTax', 'lightTax', 'healthTax', 'waterTax', 'taxRate', 'depreciationRate', 'usageFactor'];
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(propertyData)) {
      if (key === 'id') continue;
      if (numericFields.includes(key)) {
        cleanData[key] = value ? parseFloat(String(value)) : null;
      } else {
        cleanData[key] = value || null;
      }
    }

    const property = await db.propertyMaster.create({
      data: cleanData as Parameters<typeof db.propertyMaster.create>[0]['data'],
    });

    // Create owner links
    if (owners && Array.isArray(owners)) {
      for (const o of owners) {
        await db.propertyOwnerMaster.create({
          data: { propertyId: property.id, ownerId: o.ownerId, ownershipType: o.ownershipType || 'मालक' },
        });
      }
    }

    // Create tax rates for this property
    if (taxRates && Array.isArray(taxRates)) {
      for (const tr of taxRates) {
        if (tr.rate > 0) {
          await db.propertyTaxRate.create({
            data: {
              propertyId: property.id,
              taxMasterId: tr.taxMasterId,
              rate: parseFloat(tr.rate),
            },
          });
        }
      }
    }

    const result = await db.propertyMaster.findUnique({
      where: { id: property.id },
      include: {
        ward: true,
        road: true,
        owner: true,
        owners: { include: { owner: true } },
        taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } },
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('Error creating property:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ success: false, error: 'मालमत्ता क्रमांक आधीच अस्तित्वात आहे' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create property' }, { status: 500 });
  }
}

// PUT update property
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { owners, taxRates, ...propertyData } = body;

    const numericFields = ['areaSqFt', 'builtUpArea', 'houseTax', 'lightTax', 'healthTax', 'waterTax', 'taxRate', 'depreciationRate', 'usageFactor'];
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(propertyData)) {
      if (key === 'id') continue;
      if (numericFields.includes(key)) {
        cleanData[key] = value ? parseFloat(String(value)) : null;
      } else {
        cleanData[key] = value || null;
      }
    }

    const property = await db.propertyMaster.update({
      where: { id: propertyData.id },
      data: cleanData as Parameters<typeof db.propertyMaster.update>[0]['data'],
    });

    // Update owner links
    if (owners && Array.isArray(owners)) {
      await db.propertyOwnerMaster.deleteMany({ where: { propertyId: property.id } });
      for (const o of owners) {
        await db.propertyOwnerMaster.create({
          data: { propertyId: property.id, ownerId: o.ownerId, ownershipType: o.ownershipType || 'मालक' },
        });
      }
    }

    // Update tax rates - delete existing and recreate
    if (taxRates && Array.isArray(taxRates)) {
      await db.propertyTaxRate.deleteMany({ where: { propertyId: property.id } });
      for (const tr of taxRates) {
        if (tr.rate > 0) {
          await db.propertyTaxRate.create({
            data: { propertyId: property.id, taxMasterId: tr.taxMasterId, rate: parseFloat(tr.rate) },
          });
        }
      }
    }

    const result = await db.propertyMaster.findUnique({
      where: { id: property.id },
      include: {
        ward: true,
        road: true,
        owner: true,
        owners: { include: { owner: true } },
        taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } },
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json({ success: false, error: 'Failed to update property' }, { status: 500 });
  }
}

// DELETE property
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    await db.propertyMaster.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete property' }, { status: 500 });
  }
}
