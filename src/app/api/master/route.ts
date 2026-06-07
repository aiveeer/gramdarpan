import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - fetch any master table data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');
    const search = searchParams.get('search');

    if (!table) {
      return NextResponse.json({ error: 'Table name required' }, { status: 400 });
    }

    const where: Record<string, unknown> = {};
    if (id) where.id = id;
    if (search) {
      switch (table) {
        case 'ward':
          where.OR = [{ wardNumber: { contains: search } }, { wardName: { contains: search } }, { wardNameMr: { contains: search } }];
          break;
        case 'owner':
          where.OR = [{ ownerNumber: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }, { mobileNumber: { contains: search } }];
          break;
        case 'road':
          where.OR = [{ roadNumber: { contains: search } }, { roadName: { contains: search } }];
          break;
        case 'property':
          where.OR = [{ propertyNumber: { contains: search } }];
          break;
      }
    }

    let include: Record<string, unknown> | undefined;
    if (table === 'property') {
      include = {
        ward: true,
        road: true,
        owners: { include: { owner: true } },
        taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } },
      };
    }

    let data;
    switch (table) {
      case 'village':
        data = id ? await db.villageInfo.findUnique({ where: { id } }) : await db.villageInfo.findFirst();
        break;
      case 'ward':
        data = id ? await db.wardMaster.findUnique({ where: { id } }) : await db.wardMaster.findMany({ where, orderBy: { wardNumber: 'asc' } });
        break;
      case 'owner':
        data = id ? await db.ownerMaster.findUnique({ where: { id }, include: { properties: { include: { property: true } } } }) : await db.ownerMaster.findMany({ where, orderBy: { createdAt: 'desc' } });
        break;
      case 'road':
        data = id ? await db.roadMaster.findUnique({ where: { id } }) : await db.roadMaster.findMany({ where, orderBy: { roadNumber: 'asc' } });
        break;
      case 'drainage':
        data = id ? await db.drainageMaster.findUnique({ where: { id } }) : await db.drainageMaster.findMany({ where, orderBy: { drainageNumber: 'asc' } });
        break;
      case 'waterSupply':
        data = id ? await db.waterSupplyMaster.findUnique({ where: { id } }) : await db.waterSupplyMaster.findMany({ where, orderBy: { createdAt: 'desc' } });
        break;
      case 'streetLight':
        data = id ? await db.streetLightMaster.findUnique({ where: { id } }) : await db.streetLightMaster.findMany({ where, orderBy: { lightNumber: 'asc' } });
        break;
      case 'readyReckoner':
        data = id ? await db.readyReckonerMaster.findUnique({ where: { id } }) : await db.readyReckonerMaster.findMany({ orderBy: { year: 'desc' } });
        break;
      case 'disability':
        data = id ? await db.disabilityMaster.findUnique({ where: { id } }) : await db.disabilityMaster.findMany();
        break;
      case 'employee':
        data = id ? await db.employeeMaster.findUnique({ where: { id } }) : await db.employeeMaster.findMany({ where, orderBy: { employeeId: 'asc' } });
        break;
      case 'tax':
        data = id ? await db.taxMaster.findUnique({ where: { id } }) : await db.taxMaster.findMany({ orderBy: { order: 'asc' } });
        break;
      case 'property':
        data = id ? await db.propertyMaster.findUnique({ where: { id }, include }) : await db.propertyMaster.findMany({ where, include, orderBy: { createdAt: 'desc' } });
        break;
      default:
        return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Master GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - create or update master data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, action, data } = body;

    if (action === 'seed') {
      return await handleSeed(table);
    }

    if (!table || !data) {
      return NextResponse.json({ error: 'Table and data required' }, { status: 400 });
    }

    const result = await handleUpsert(table, data);
    return NextResponse.json(result, { status: data.id ? 200 : 201 });
  } catch (error: unknown) {
    console.error('Master POST error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'डुप्लिकेट रेकॉर्ड - हा क्रमांक आधीच अस्तित्वात आहे' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');

    if (!table || !id) {
      return NextResponse.json({ error: 'Table and ID required' }, { status: 400 });
    }

    await handleDelete(table, id);
    return NextResponse.json({ message: 'Record deleted' });
  } catch (error) {
    console.error('Master DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

async function handleSeed(table: string) {
  switch (table) {
    case 'tax': {
      const existing = await db.taxMaster.count();
      if (existing > 0) return NextResponse.json({ message: 'Already seeded', count: existing });
      const taxes = [
        { name: 'House Tax', nameMarathi: 'गृहकर', rate: 10, isEnabled: true, order: 1, category: 'general' },
        { name: 'Water Tax', nameMarathi: 'पाणीकर', rate: 5, isEnabled: true, order: 2, category: 'general' },
        { name: 'Light Tax', nameMarathi: 'दिवाबती कर', rate: 5, isEnabled: true, order: 3, category: 'general' },
        { name: 'Health Tax', nameMarathi: 'आरोग्य कर', rate: 3, isEnabled: true, order: 4, category: 'general' },
        { name: 'Education Tax', nameMarathi: 'शिक्षण कर', rate: 2, isEnabled: true, order: 5, category: 'general' },
        { name: 'Tree Tax', nameMarathi: 'वृक्ष कर', rate: 1, isEnabled: true, order: 6, category: 'general' },
        { name: 'Employment Tax', nameMarathi: 'रोजगार कर', rate: 2, isEnabled: true, order: 7, category: 'general' },
        { name: 'Drainage Tax', nameMarathi: 'नाला कर', rate: 3, isEnabled: true, order: 8, category: 'general' },
        { name: 'Sanitation Tax', nameMarathi: 'स्वच्छता कर', rate: 3, isEnabled: true, order: 9, category: 'general' },
        { name: 'Fire Tax', nameMarathi: 'अग्निशामक कर', rate: 1, isEnabled: true, order: 10, category: 'general' },
        { name: 'Special Tax', nameMarathi: 'विशेष कर', rate: 2, isEnabled: false, order: 11, category: 'general' },
        { name: 'Penalty', nameMarathi: 'दंड', rate: 0, isEnabled: true, order: 12, category: 'penalty' },
        { name: 'Interest', nameMarathi: 'व्याज', rate: 0, isEnabled: true, order: 13, category: 'interest' },
        { name: 'Other Charges', nameMarathi: 'इतर आकारणी', rate: 0, isEnabled: false, order: 14, category: 'other' },
      ];
      const created = await db.taxMaster.createMany({ data: taxes });
      return NextResponse.json({ message: 'Tax masters seeded', count: created.count });
    }
    case 'disability': {
      const existing = await db.disabilityMaster.count();
      if (existing > 0) return NextResponse.json({ message: 'Already seeded' });
      const types = [
        { disabilityType: 'Visual', disabilityTypeMr: 'दृष्टी', percentageRange: '40-100', description: 'दृष्टी दोष' },
        { disabilityType: 'Hearing', disabilityTypeMr: 'श्रवण', percentageRange: '40-100', description: 'श्रवण दोष' },
        { disabilityType: 'Locomotor', disabilityTypeMr: 'चलनवलन', percentageRange: '40-100', description: 'चलनवलन दोष' },
        { disabilityType: 'Mental', disabilityTypeMr: 'मानसिक', percentageRange: '40-100', description: 'मानसिक दोष' },
        { disabilityType: 'Multiple', disabilityTypeMr: 'बहुदोष', percentageRange: '40-100', description: 'अनेक दोष' },
      ];
      await db.disabilityMaster.createMany({ data: types });
      return NextResponse.json({ message: 'Disability types seeded' });
    }
    default:
      return NextResponse.json({ error: 'No seed for this table' }, { status: 400 });
  }
}

async function handleUpsert(table: string, data: Record<string, unknown>) {
  const isUpdate = !!data.id;
  const id = data.id as string | undefined;

  // Remove id for create
  const { id: _id, ...createData } = data;

  // Handle property special case with owners and taxRates
  if (table === 'property') {
    const { owners, taxRates, ...propData } = data as Record<string, unknown> & {
      owners?: { ownerId: string; ownershipType: string }[];
      taxRates?: { taxMasterId: string; rate: number }[];
    };

    // Convert numeric strings to numbers
    const cleanPropData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(propData)) {
      if (key === 'id') continue;
      if (key === 'area' || key === 'builtUpArea') {
        cleanPropData[key] = value ? parseFloat(String(value)) : null;
      } else {
        cleanPropData[key] = value || null;
      }
    }

    if (isUpdate && id) {
      // Update property
      await db.propertyMaster.update({ where: { id }, data: cleanPropData });

      // Recreate owners
      if (owners && Array.isArray(owners)) {
        await db.propertyOwner.deleteMany({ where: { propertyId: id } });
        for (const o of owners) {
          await db.propertyOwner.create({
            data: { propertyId: id, ownerId: o.ownerId, ownershipType: o.ownershipType },
          });
        }
      }

      // Recreate tax rates
      if (taxRates && Array.isArray(taxRates)) {
        await db.propertyTaxRate.deleteMany({ where: { propertyId: id } });
        for (const tr of taxRates) {
          if (tr.rate > 0) {
            await db.propertyTaxRate.create({
              data: { propertyId: id, taxMasterId: tr.taxMasterId, rate: tr.rate },
            });
          }
        }
      }

      return db.propertyMaster.findUnique({
        where: { id },
        include: { ward: true, road: true, owners: { include: { owner: true } }, taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } } },
      });
    }

    // Create property
    const property = await db.propertyMaster.create({ data: cleanPropData as Parameters<typeof db.propertyMaster.create>[0]['data'] });

    // Create owners
    if (owners && Array.isArray(owners)) {
      for (const o of owners) {
        await db.propertyOwner.create({
          data: { propertyId: property.id, ownerId: o.ownerId, ownershipType: o.ownershipType },
        });
      }
    }

    // Create tax rates
    if (taxRates && Array.isArray(taxRates)) {
      for (const tr of taxRates) {
        if (tr.rate > 0) {
          await db.propertyTaxRate.create({
            data: { propertyId: property.id, taxMasterId: tr.taxMasterId, rate: tr.rate },
          });
        }
      }
    }

    return db.propertyMaster.findUnique({
      where: { id: property.id },
      include: { ward: true, road: true, owners: { include: { owner: true } }, taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } } },
    });
  }

  // Generic upsert for other tables
  if (isUpdate && id) {
    switch (table) {
      case 'ward': return db.wardMaster.update({ where: { id }, data: createData as Parameters<typeof db.wardMaster.update>[0]['data'] });
      case 'owner': return db.ownerMaster.update({ where: { id }, data: createData as Parameters<typeof db.ownerMaster.update>[0]['data'] });
      case 'road': return db.roadMaster.update({ where: { id }, data: createData as Parameters<typeof db.roadMaster.update>[0]['data'] });
      case 'drainage': return db.drainageMaster.update({ where: { id }, data: createData as Parameters<typeof db.drainageMaster.update>[0]['data'] });
      case 'waterSupply': return db.waterSupplyMaster.update({ where: { id }, data: createData as Parameters<typeof db.waterSupplyMaster.update>[0]['data'] });
      case 'streetLight': return db.streetLightMaster.update({ where: { id }, data: createData as Parameters<typeof db.streetLightMaster.update>[0]['data'] });
      case 'readyReckoner': return db.readyReckonerMaster.update({ where: { id }, data: createData as Parameters<typeof db.readyReckonerMaster.update>[0]['data'] });
      case 'disability': return db.disabilityMaster.update({ where: { id }, data: createData as Parameters<typeof db.disabilityMaster.update>[0]['data'] });
      case 'employee': return db.employeeMaster.update({ where: { id }, data: createData as Parameters<typeof db.employeeMaster.update>[0]['data'] });
      case 'tax': return db.taxMaster.update({ where: { id }, data: createData as Parameters<typeof db.taxMaster.update>[0]['data'] });
      case 'village': return db.villageInfo.update({ where: { id }, data: createData as Parameters<typeof db.villageInfo.update>[0]['data'] });
    }
  }

  // Create
  switch (table) {
    case 'ward': return db.wardMaster.create({ data: createData as Parameters<typeof db.wardMaster.create>[0]['data'] });
    case 'owner': return db.ownerMaster.create({ data: createData as Parameters<typeof db.ownerMaster.create>[0]['data'] });
    case 'road': return db.roadMaster.create({ data: createData as Parameters<typeof db.roadMaster.create>[0]['data'] });
    case 'drainage': return db.drainageMaster.create({ data: createData as Parameters<typeof db.drainageMaster.create>[0]['data'] });
    case 'waterSupply': return db.waterSupplyMaster.create({ data: createData as Parameters<typeof db.waterSupplyMaster.create>[0]['data'] });
    case 'streetLight': return db.streetLightMaster.create({ data: createData as Parameters<typeof db.streetLightMaster.create>[0]['data'] });
    case 'readyReckoner': return db.readyReckonerMaster.create({ data: createData as Parameters<typeof db.readyReckonerMaster.create>[0]['data'] });
    case 'disability': return db.disabilityMaster.create({ data: createData as Parameters<typeof db.disabilityMaster.create>[0]['data'] });
    case 'employee': return db.employeeMaster.create({ data: createData as Parameters<typeof db.employeeMaster.create>[0]['data'] });
    case 'tax': return db.taxMaster.create({ data: createData as Parameters<typeof db.taxMaster.create>[0]['data'] });
    case 'village': return db.villageInfo.create({ data: createData as Parameters<typeof db.villageInfo.create>[0]['data'] });
    default: throw new Error(`Unknown table: ${table}`);
  }
}

async function handleDelete(table: string, id: string) {
  switch (table) {
    case 'ward': return db.wardMaster.delete({ where: { id } });
    case 'owner': return db.ownerMaster.delete({ where: { id } });
    case 'road': return db.roadMaster.delete({ where: { id } });
    case 'drainage': return db.drainageMaster.delete({ where: { id } });
    case 'waterSupply': return db.waterSupplyMaster.delete({ where: { id } });
    case 'streetLight': return db.streetLightMaster.delete({ where: { id } });
    case 'readyReckoner': return db.readyReckonerMaster.delete({ where: { id } });
    case 'disability': return db.disabilityMaster.delete({ where: { id } });
    case 'employee': return db.employeeMaster.delete({ where: { id } });
    case 'tax': return db.taxMaster.delete({ where: { id } });
    case 'property': return db.propertyMaster.delete({ where: { id } });
    case 'village': return db.villageInfo.delete({ where: { id } });
    default: throw new Error(`Unknown table: ${table}`);
  }
}
