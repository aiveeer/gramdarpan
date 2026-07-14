import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - fetch assets by type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // stock, land, road, tree (default: asset)
    const financialYear = searchParams.get('financialYear');

    const where: Record<string, unknown> = {};
    if (financialYear) where.financialYear = financialYear;

    switch (type) {
      case 'stock': {
        const records = await db.stockEntry.findMany({ where, orderBy: { itemName: 'asc' } });
        return NextResponse.json(records);
      }
      case 'land': {
        const records = await db.landAsset.findMany({ where, orderBy: { landName: 'asc' } });
        return NextResponse.json(records);
      }
      case 'road': {
        const records = await db.roadAsset.findMany({ where, orderBy: { roadName: 'asc' } });
        return NextResponse.json(records);
      }
      case 'tree': {
        const records = await db.treeAsset.findMany({ where, orderBy: { treeType: 'asc' } });
        return NextResponse.json(records);
      }
      default: {
        // Fixed assets
        const records = await db.assetEntry.findMany({ where, orderBy: { assetName: 'asc' } });
        return NextResponse.json(records);
      }
    }
  } catch (error) {
    console.error('Assets GET error:', error);
    return NextResponse.json([]);
  }
}

// POST - create / update / delete assets
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // stock, land, road, tree

    const body = await request.json();
    const { action, id, ...data } = body;

    // Common numeric field conversion
    const convertNumbers = (obj: Record<string, unknown>, fields: string[]) => {
      for (const field of fields) {
        if (obj[field] !== undefined) obj[field] = Number(obj[field]) || 0;
      }
    };

    if (action === 'delete' && id) {
      switch (type) {
        case 'stock': await db.stockEntry.delete({ where: { id } }); break;
        case 'land': await db.landAsset.delete({ where: { id } }); break;
        case 'road': await db.roadAsset.delete({ where: { id } }); break;
        case 'tree': await db.treeAsset.delete({ where: { id } }); break;
        default: await db.assetEntry.delete({ where: { id } }); break;
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'update' && id) {
      switch (type) {
        case 'stock': {
          convertNumbers(data, ['quantity', 'ratePerUnit', 'totalValue', 'minStock', 'maxStock']);
          const updated = await db.stockEntry.update({ where: { id }, data });
          return NextResponse.json({ success: true, data: updated });
        }
        case 'land': {
          convertNumbers(data, ['areaAcres', 'areaHectares', 'areaGunthe']);
          const updated = await db.landAsset.update({ where: { id }, data });
          return NextResponse.json({ success: true, data: updated });
        }
        case 'road': {
          convertNumbers(data, ['roadLength', 'roadWidth', 'estimatedCost']);
          const updated = await db.roadAsset.update({ where: { id }, data });
          return NextResponse.json({ success: true, data: updated });
        }
        case 'tree': {
          convertNumbers(data, ['height', 'girth', 'canopyDiameter', 'estimatedValue']);
          if (data.isProtected !== undefined) data.isProtected = Boolean(data.isProtected);
          const updated = await db.treeAsset.update({ where: { id }, data });
          return NextResponse.json({ success: true, data: updated });
        }
        default: {
          convertNumbers(data, ['purchaseCost', 'currentValue', 'depreciation']);
          const updated = await db.assetEntry.update({ where: { id }, data });
          return NextResponse.json({ success: true, data: updated });
        }
      }
    }

    // Create
    switch (type) {
      case 'stock': {
        convertNumbers(data, ['quantity', 'ratePerUnit', 'totalValue', 'minStock', 'maxStock']);
        const created = await db.stockEntry.create({ data });
        return NextResponse.json({ success: true, data: created });
      }
      case 'land': {
        convertNumbers(data, ['areaAcres', 'areaHectares', 'areaGunthe']);
        const created = await db.landAsset.create({ data });
        return NextResponse.json({ success: true, data: created });
      }
      case 'road': {
        convertNumbers(data, ['roadLength', 'roadWidth', 'estimatedCost']);
        const created = await db.roadAsset.create({ data });
        return NextResponse.json({ success: true, data: created });
      }
      case 'tree': {
        convertNumbers(data, ['height', 'girth', 'canopyDiameter', 'estimatedValue']);
        if (data.isProtected !== undefined) data.isProtected = Boolean(data.isProtected);
        const created = await db.treeAsset.create({ data });
        return NextResponse.json({ success: true, data: created });
      }
      default: {
        convertNumbers(data, ['purchaseCost', 'currentValue', 'depreciation']);
        const created = await db.assetEntry.create({ data });
        return NextResponse.json({ success: true, data: created });
      }
    }
  } catch (error) {
    console.error('Assets POST error:', error);
    return NextResponse.json({ error: 'मालमत्ता जतन करताना त्रुटी' }, { status: 500 });
  }
}
