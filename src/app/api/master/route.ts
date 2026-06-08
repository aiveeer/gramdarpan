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
    // Map short table names to full names
    const tableAlias: Record<string, string> = {
      'fy': 'financialYear',
      'bank': 'bankAccount',
      'budget-head': 'budgetHead',
      'scheme': 'schemeInfo',
      'contractor': 'contractorMaster',
    };
    const resolvedTable = tableAlias[table] || table;

    if (search) {
      switch (resolvedTable) {
        case 'ward':
          where.OR = [{ wardNumber: { contains: search } }, { wardName: { contains: search } }, { wardNameMr: { contains: search } }];
          break;
        case 'owner':
          where.OR = [{ ownerNumber: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }, { mobileNumber: { contains: search } }, { firstNameMr: { contains: search } }, { lastNameMr: { contains: search } }];
          break;
        case 'road':
          where.OR = [{ roadNumber: { contains: search } }, { roadName: { contains: search } }];
          break;
        case 'property':
          where.OR = [{ propertyNumber: { contains: search } }];
          break;
        case 'financialYear':
          where.OR = [{ year: { contains: search } }];
          break;
        case 'bankAccount':
          where.OR = [{ accountNumber: { contains: search } }, { bankName: { contains: search } }, { branchName: { contains: search } }];
          break;
        case 'budgetHead':
          where.OR = [{ code: { contains: search } }, { name: { contains: search } }, { nameMr: { contains: search } }];
          break;
        case 'schemeInfo':
          where.OR = [{ schemeNumber: { contains: search } }, { schemeName: { contains: search } }, { schemeNameMr: { contains: search } }];
          break;
        case 'contractorMaster':
          where.OR = [{ contractorId: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }, { firmName: { contains: search } }, { mobileNumber: { contains: search } }];
          break;
        case 'floorInfo':
          where.OR = [{ floorNumber: { contains: search } }, { floorName: { contains: search } }, { floorNameMr: { contains: search } }];
          break;
        case 'demandCategory':
          where.OR = [{ code: { contains: search } }, { name: { contains: search } }, { nameMr: { contains: search } }];
          break;
        case 'contractor':
          where.OR = [{ contractorId: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }, { firmName: { contains: search } }, { mobileNumber: { contains: search } }];
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
    switch (resolvedTable) {
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
      // New master tables
      case 'financialYear':
        data = id ? await db.financialYear.findUnique({ where: { id } }) : await db.financialYear.findMany({ where, orderBy: { year: 'desc' } });
        break;
      case 'bankAccount':
        data = id ? await db.bankAccount.findUnique({ where: { id } }) : await db.bankAccount.findMany({ where, orderBy: { bankName: 'asc' } });
        break;
      case 'budgetHead':
        data = id ? await db.budgetHead.findUnique({ where: { id } }) : await db.budgetHead.findMany({ where, orderBy: { code: 'asc' } });
        break;
      case 'schemeInfo':
        data = id ? await db.schemeInfo.findUnique({ where: { id } }) : await db.schemeInfo.findMany({ where, orderBy: { schemeNumber: 'asc' } });
        break;
      case 'contractorMaster':
        data = id ? await db.contractorMaster.findUnique({ where: { id } }) : await db.contractorMaster.findMany({ where, orderBy: { contractorId: 'asc' } });
        break;
      case 'floorInfo':
        data = id ? await db.floorInfo.findUnique({ where: { id } }) : await db.floorInfo.findMany({ where, orderBy: { floorIndex: 'asc' } });
        break;
      case 'demandCategory':
        data = id ? await db.demandCategory.findUnique({ where: { id } }) : await db.demandCategory.findMany({ where, orderBy: { code: 'asc' } });
        break;
      case 'contractor':
        data = id ? await db.contractorMaster.findUnique({ where: { id } }) : await db.contractorMaster.findMany({ where, orderBy: { contractorId: 'asc' } });
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

    // Map short table names to full names
    const tableAlias: Record<string, string> = {
      'fy': 'financialYear',
      'bank': 'bankAccount',
      'budget-head': 'budgetHead',
      'scheme': 'schemeInfo',
      'contractor': 'contractorMaster',
    };
    const resolvedTable = tableAlias[table] || table;

    const result = await handleUpsert(resolvedTable, data);
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

    // Map short table names to full names
    const tableAlias: Record<string, string> = {
      'fy': 'financialYear',
      'bank': 'bankAccount',
      'budget-head': 'budgetHead',
      'scheme': 'schemeInfo',
      'contractor': 'contractorMaster',
    };
    const resolvedTable = tableAlias[table] || table;

    await handleDelete(resolvedTable, id);
    return NextResponse.json({ message: 'Record deleted' });
  } catch (error) {
    console.error('Master DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

async function handleSeed(table: string) {
  // Map short table names to full names
  const tableAlias: Record<string, string> = {
    'fy': 'financialYear',
    'bank': 'bankAccount',
    'budget-head': 'budgetHead',
    'scheme': 'schemeInfo',
    'contractor': 'contractorMaster',
  };
  const resolvedTable = tableAlias[table] || table;

  switch (resolvedTable) {
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
    case 'financialYear': {
      const existing = await db.financialYear.count();
      if (existing > 0) return NextResponse.json({ message: 'Already seeded', count: existing });
      const years = [
        { year: '2023-24', startDate: '2023-04-01', endDate: '2024-03-31', isActive: false, isLocked: true },
        { year: '2024-25', startDate: '2024-04-01', endDate: '2025-03-31', isActive: true, isLocked: false },
        { year: '2025-26', startDate: '2025-04-01', endDate: '2026-03-31', isActive: false, isLocked: false },
      ];
      const created = await db.financialYear.createMany({ data: years });
      return NextResponse.json({ message: 'Financial years seeded', count: created.count });
    }
    case 'floorInfo': {
      const existing = await db.floorInfo.count();
      if (existing > 0) return NextResponse.json({ message: 'Already seeded', count: existing });
      const floors = [
        { floorNumber: '0', floorName: 'Ground Floor', floorNameMr: 'तळमजला', floorIndex: 0 },
        { floorNumber: '1', floorName: 'First Floor', floorNameMr: 'पहिला मजला', floorIndex: 1 },
        { floorNumber: '2', floorName: 'Second Floor', floorNameMr: 'दुसरा मजला', floorIndex: 2 },
        { floorNumber: '3', floorName: 'Third Floor', floorNameMr: 'तिसरा मजला', floorIndex: 3 },
        { floorNumber: '4', floorName: 'Fourth Floor', floorNameMr: 'चौथा मजला', floorIndex: 4 },
      ];
      const created = await db.floorInfo.createMany({ data: floors });
      return NextResponse.json({ message: 'Floor info seeded', count: created.count });
    }
    case 'demandCategory': {
      const existing = await db.demandCategory.count();
      if (existing > 0) return NextResponse.json({ message: 'Already seeded', count: existing });
      const categories = [
        { code: 'HOUSE_TAX', name: 'House Tax', nameMr: 'गृहकर', description: 'Annual house tax demand' },
        { code: 'WATER_TAX', name: 'Water Tax', nameMr: 'पाणीकर', description: 'Water supply tax demand' },
        { code: 'LIGHT_TAX', name: 'Light Tax', nameMr: 'दिवाबती कर', description: 'Street light tax demand' },
        { code: 'HEALTH_TAX', name: 'Health Tax', nameMr: 'आरोग्य कर', description: 'Health & sanitation tax demand' },
        { code: 'EDUCATION_TAX', name: 'Education Tax', nameMr: 'शिक्षण कर', description: 'Education cess demand' },
        { code: 'PENALTY', name: 'Penalty', nameMr: 'दंड', description: 'Late payment penalty' },
        { code: 'INTEREST', name: 'Interest', nameMr: 'व्याज', description: 'Interest on arrears' },
        { code: 'WATER_BILL', name: 'Water Bill', nameMr: 'पाणी बिल', description: 'Water consumption bill' },
        { code: 'OTHER', name: 'Other', nameMr: 'इतर', description: 'Other charges' },
      ];
      const created = await db.demandCategory.createMany({ data: categories });
      return NextResponse.json({ message: 'Demand categories seeded', count: created.count });
    }
    case 'budgetHead': {
      const existing = await db.budgetHead.count();
      if (existing > 0) return NextResponse.json({ message: 'Already seeded', count: existing });
      const heads = [
        { code: '1001', name: 'Property Tax', nameMr: 'मालमत्ता कर', category: 'income', type: 'revenue' },
        { code: '1002', name: 'Water Tax', nameMr: 'पाणीकर', category: 'income', type: 'revenue' },
        { code: '1003', name: 'Light Tax', nameMr: 'दिवाबती कर', category: 'income', type: 'revenue' },
        { code: '1004', name: 'Health Tax', nameMr: 'आरोग्य कर', category: 'income', type: 'revenue' },
        { code: '1005', name: 'Education Tax', nameMr: 'शिक्षण कर', category: 'income', type: 'revenue' },
        { code: '1006', name: 'Other Income', nameMr: 'इतर उत्पन्न', category: 'income', type: 'revenue' },
        { code: '1007', name: 'Grant Income', nameMr: 'अनुदान उत्पन्न', category: 'income', type: 'capital' },
        { code: '2001', name: 'Salary', nameMr: 'पगार', category: 'expenditure', type: 'revenue' },
        { code: '2002', name: 'Electricity', nameMr: 'वीज', category: 'expenditure', type: 'revenue' },
        { code: '2003', name: 'Water Supply', nameMr: 'पाणीपुरवठा', category: 'expenditure', type: 'revenue' },
        { code: '2004', name: 'Road Maintenance', nameMr: 'रस्ता देखभाल', category: 'expenditure', type: 'revenue' },
        { code: '2005', name: 'Sanitation', nameMr: 'स्वच्छता', category: 'expenditure', type: 'revenue' },
        { code: '2006', name: 'Development Works', nameMr: 'विकास कामे', category: 'expenditure', type: 'capital' },
        { code: '3001', name: 'Buildings', nameMr: 'इमारती', category: 'asset', type: 'capital' },
        { code: '3002', name: 'Land', nameMr: 'जमीन', category: 'asset', type: 'capital' },
        { code: '3003', name: 'Vehicles', nameMr: 'वाहने', category: 'asset', type: 'capital' },
        { code: '4001', name: 'Bank Balance', nameMr: 'बँक शिल्लक', category: 'liability', type: 'revenue' },
      ];
      const created = await db.budgetHead.createMany({ data: heads });
      return NextResponse.json({ message: 'Budget heads seeded', count: created.count });
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
    const numericFields = ['area', 'builtUpArea', 'lengthEast', 'widthEast', 'lengthWest', 'widthWest', 'lengthSouth', 'widthSouth', 'lengthNorth', 'widthNorth', 'totalLength', 'totalWidth', 'depreciationRate', 'usageFactor', 'taxRate', 'houseTax', 'lightTax', 'healthTax', 'waterTax'];
    const cleanPropData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(propData)) {
      if (key === 'id') continue;
      if (numericFields.includes(key)) {
        cleanPropData[key] = value ? parseFloat(String(value)) : null;
      } else {
        cleanPropData[key] = value || null;
      }
    }

    if (isUpdate && id) {
      await db.propertyMaster.update({ where: { id }, data: cleanPropData });

      if (owners && Array.isArray(owners)) {
        await db.propertyOwner.deleteMany({ where: { propertyId: id } });
        for (const o of owners) {
          await db.propertyOwner.create({
            data: { propertyId: id, ownerId: o.ownerId, ownershipType: o.ownershipType },
          });
        }
      }

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

    const property = await db.propertyMaster.create({ data: cleanPropData as Parameters<typeof db.propertyMaster.create>[0]['data'] });

    if (owners && Array.isArray(owners)) {
      for (const o of owners) {
        await db.propertyOwner.create({
          data: { propertyId: property.id, ownerId: o.ownerId, ownershipType: o.ownershipType },
        });
      }
    }

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

  // Numeric field conversion for ALL tables
  const numericFieldsForTable: Record<string, string[]> = {
    ward: ['population', 'area'],
    owner: ['disabilityPercentage'],
    road: ['length', 'width'],
    drainage: ['length'],
    waterSupply: ['monthlyRate'],
    streetLight: ['wattage'],
    readyReckoner: ['ratePerSqFt'],
    employee: ['salary'],
    tax: ['rate', 'order'],
    village: ['population', 'totalArea'],
    bankAccount: ['balance'],
    budgetHead: [],
    schemeInfo: ['totalAllocation'],
    contractorMaster: [],
    financialYear: [],
    floorInfo: ['floorIndex'],
    demandCategory: [],
  };
  const numericFields = numericFieldsForTable[table] || [];

  // Integer fields (must be converted to Int, not Float)
  const intFieldsForTable: Record<string, string[]> = {
    ward: ['population'],
    employee: [],
    tax: ['order'],
    floorInfo: ['floorIndex'],
  };
  // Boolean fields that must not be converted to null when false
  const boolFieldsForTable: Record<string, string[]> = {
    owner: ['isDisabled'],
    employee: ['isActive'],
    financialYear: ['isActive', 'isLocked'],
    bankAccount: ['isActive'],
    budgetHead: ['isActive'],
    schemeInfo: ['isActive'],
    contractorMaster: ['isActive'],
    contractor: ['isActive'],
  };
  const boolFields = boolFieldsForTable[table] || [];
  const intFields = intFieldsForTable[table] || [];

  const cleanData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(createData)) {
    if (boolFields.includes(key)) {
      cleanData[key] = value === true || value === 'true' || value === 1;
    } else if (intFields.includes(key)) {
      cleanData[key] = value ? parseInt(String(value)) : null;
    } else if (numericFields.includes(key)) {
      cleanData[key] = value ? parseFloat(String(value)) : null;
    } else {
      cleanData[key] = (value === null || value === undefined) ? null : value;
    }
  }

  // Remove null values for optional fields that Prisma doesn't accept as null on create
  if (!isUpdate) {
    for (const [key, value] of Object.entries(cleanData)) {
      if (value === null || value === undefined || value === '') {
        delete cleanData[key];
      }
    }
  }

  // Generic upsert for other tables
  if (isUpdate && id) {
    switch (table) {
      case 'ward': return db.wardMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.wardMaster.update>[0]['data'] });
      case 'owner': return db.ownerMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.ownerMaster.update>[0]['data'] });
      case 'road': return db.roadMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.roadMaster.update>[0]['data'] });
      case 'drainage': return db.drainageMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.drainageMaster.update>[0]['data'] });
      case 'waterSupply': return db.waterSupplyMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.waterSupplyMaster.update>[0]['data'] });
      case 'streetLight': return db.streetLightMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.streetLightMaster.update>[0]['data'] });
      case 'readyReckoner': return db.readyReckonerMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.readyReckonerMaster.update>[0]['data'] });
      case 'disability': return db.disabilityMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.disabilityMaster.update>[0]['data'] });
      case 'employee': return db.employeeMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.employeeMaster.update>[0]['data'] });
      case 'tax': return db.taxMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.taxMaster.update>[0]['data'] });
      case 'village': return db.villageInfo.update({ where: { id }, data: cleanData as Parameters<typeof db.villageInfo.update>[0]['data'] });
      // New master tables
      case 'financialYear': return db.financialYear.update({ where: { id }, data: cleanData as Parameters<typeof db.financialYear.update>[0]['data'] });
      case 'bankAccount': return db.bankAccount.update({ where: { id }, data: cleanData as Parameters<typeof db.bankAccount.update>[0]['data'] });
      case 'budgetHead': return db.budgetHead.update({ where: { id }, data: cleanData as Parameters<typeof db.budgetHead.update>[0]['data'] });
      case 'schemeInfo': return db.schemeInfo.update({ where: { id }, data: cleanData as Parameters<typeof db.schemeInfo.update>[0]['data'] });
      case 'floorInfo': return db.floorInfo.update({ where: { id }, data: cleanData as Parameters<typeof db.floorInfo.update>[0]['data'] });
      case 'demandCategory': return db.demandCategory.update({ where: { id }, data: cleanData as Parameters<typeof db.demandCategory.update>[0]['data'] });
      case 'contractor': return db.contractorMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.contractorMaster.update>[0]['data'] });
      case 'contractorMaster': return db.contractorMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.contractorMaster.update>[0]['data'] });
    }
  }

  // Create
  switch (table) {
    case 'ward': return db.wardMaster.create({ data: cleanData as Parameters<typeof db.wardMaster.create>[0]['data'] });
    case 'owner': return db.ownerMaster.create({ data: cleanData as Parameters<typeof db.ownerMaster.create>[0]['data'] });
    case 'road': return db.roadMaster.create({ data: cleanData as Parameters<typeof db.roadMaster.create>[0]['data'] });
    case 'drainage': return db.drainageMaster.create({ data: cleanData as Parameters<typeof db.drainageMaster.create>[0]['data'] });
    case 'waterSupply': return db.waterSupplyMaster.create({ data: cleanData as Parameters<typeof db.waterSupplyMaster.create>[0]['data'] });
    case 'streetLight': return db.streetLightMaster.create({ data: cleanData as Parameters<typeof db.streetLightMaster.create>[0]['data'] });
    case 'readyReckoner': return db.readyReckonerMaster.create({ data: cleanData as Parameters<typeof db.readyReckonerMaster.create>[0]['data'] });
    case 'disability': return db.disabilityMaster.create({ data: cleanData as Parameters<typeof db.disabilityMaster.create>[0]['data'] });
    case 'employee': return db.employeeMaster.create({ data: cleanData as Parameters<typeof db.employeeMaster.create>[0]['data'] });
    case 'tax': return db.taxMaster.create({ data: cleanData as Parameters<typeof db.taxMaster.create>[0]['data'] });
    case 'village': return db.villageInfo.create({ data: cleanData as Parameters<typeof db.villageInfo.create>[0]['data'] });
    // New master tables
    case 'financialYear': return db.financialYear.create({ data: cleanData as Parameters<typeof db.financialYear.create>[0]['data'] });
    case 'bankAccount': return db.bankAccount.create({ data: cleanData as Parameters<typeof db.bankAccount.create>[0]['data'] });
    case 'budgetHead': return db.budgetHead.create({ data: cleanData as Parameters<typeof db.budgetHead.create>[0]['data'] });
    case 'schemeInfo': return db.schemeInfo.create({ data: cleanData as Parameters<typeof db.schemeInfo.create>[0]['data'] });
    case 'floorInfo': return db.floorInfo.create({ data: cleanData as Parameters<typeof db.floorInfo.create>[0]['data'] });
    case 'demandCategory': return db.demandCategory.create({ data: cleanData as Parameters<typeof db.demandCategory.create>[0]['data'] });
    case 'contractor': return db.contractorMaster.create({ data: cleanData as Parameters<typeof db.contractorMaster.create>[0]['data'] });
    case 'contractorMaster': return db.contractorMaster.create({ data: cleanData as Parameters<typeof db.contractorMaster.create>[0]['data'] });
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
    // New master tables
    case 'financialYear': return db.financialYear.delete({ where: { id } });
    case 'bankAccount': return db.bankAccount.delete({ where: { id } });
    case 'budgetHead': return db.budgetHead.delete({ where: { id } });
    case 'schemeInfo': return db.schemeInfo.delete({ where: { id } });
    case 'floorInfo': return db.floorInfo.delete({ where: { id } });
    case 'demandCategory': return db.demandCategory.delete({ where: { id } });
    case 'contractor': return db.contractorMaster.delete({ where: { id } });
    default: throw new Error(`Unknown table: ${table}`);
  }
}
