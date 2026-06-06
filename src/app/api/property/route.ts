import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET all properties or search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const id = searchParams.get('id');

    if (id) {
      const property = await db.property.findUnique({
        where: { id },
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
      return NextResponse.json(property);
    }

    if (search) {
      const properties = await db.property.findMany({
        where: {
          OR: [
            { propertyNumber: { contains: search } },
            { ownerName: { contains: search } },
            { mobileNumber: { contains: search } },
          ],
        },
        include: {
          taxRates: {
            include: { taxMaster: true },
            orderBy: { taxMaster: { order: 'asc' } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(properties);
    }

    const properties = await db.property.findMany({
      include: {
        taxRates: {
          include: { taxMaster: true },
          orderBy: { taxMaster: { order: 'asc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

// POST create property
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taxRates, ...propertyData } = body;

    const property = await db.property.create({
      data: {
        propertyNumber: propertyData.propertyNumber,
        ownerName: propertyData.ownerName,
        occupantName: propertyData.occupantName || null,
        mobileNumber: propertyData.mobileNumber || null,
        ward: propertyData.ward || null,
        road: propertyData.road || null,
        citySurveyNo: propertyData.citySurveyNo || null,
        area: propertyData.area ? parseFloat(propertyData.area) : null,
        boundaries: propertyData.boundaries || null,
        constructionType: propertyData.constructionType || null,
        usageType: propertyData.usageType || null,
        floorInfo: propertyData.floorInfo || null,
      },
    });

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

    const result = await db.property.findUnique({
      where: { id: property.id },
      include: {
        taxRates: {
          include: { taxMaster: true },
          orderBy: { taxMaster: { order: 'asc' } },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating property:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'मालमत्ता क्रमांक आधीच अस्तित्वात आहे' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}

// PUT update property
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taxRates, ...propertyData } = body;

    const property = await db.property.update({
      where: { id: propertyData.id },
      data: {
        propertyNumber: propertyData.propertyNumber,
        ownerName: propertyData.ownerName,
        occupantName: propertyData.occupantName || null,
        mobileNumber: propertyData.mobileNumber || null,
        ward: propertyData.ward || null,
        road: propertyData.road || null,
        citySurveyNo: propertyData.citySurveyNo || null,
        area: propertyData.area ? parseFloat(propertyData.area) : null,
        boundaries: propertyData.boundaries || null,
        constructionType: propertyData.constructionType || null,
        usageType: propertyData.usageType || null,
        floorInfo: propertyData.floorInfo || null,
      },
    });

    // Update tax rates - delete existing and recreate
    if (taxRates && Array.isArray(taxRates)) {
      await db.propertyTaxRate.deleteMany({
        where: { propertyId: property.id },
      });

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

    const result = await db.property.findUnique({
      where: { id: property.id },
      include: {
        taxRates: {
          include: { taxMaster: true },
          orderBy: { taxMaster: { order: 'asc' } },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

// DELETE property
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    await db.property.delete({ where: { id } });
    return NextResponse.json({ message: 'Property deleted' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
