import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Map short table names to Prisma model access names
const tableAlias: Record<string, string> = {
  'fy': 'financialYear',
  'bank': 'bankAccount',
  'budget-head': 'budgetHead',
  'scheme': 'schemeInfo',
  'contractor': 'contractorMaster',
  'taxAssessment': 'taxAssessment',
  'demand': 'demandRegister',
  'taxPayment': 'taxPayment',
};

function resolveTable(table: string): string {
  return tableAlias[table] || table;
}

// GET - fetch any master table data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const financialYear = searchParams.get('financialYear');

    if (!table) {
      return NextResponse.json({ success: false, error: 'Table name required' }, { status: 400 });
    }

    const resolvedTable = resolveTable(table);

    const where: Record<string, unknown> = {};
    if (id) where.id = id;
    if (financialYear) where.financialYear = financialYear;

    if (search) {
      switch (resolvedTable) {
        case 'wardMaster':
          where.OR = [{ wardNo: { contains: search } }, { wardName: { contains: search } }, { wardNameMr: { contains: search } }];
          break;
        case 'ownerMaster':
          where.OR = [{ ownerName: { contains: search } }, { ownerNameMr: { contains: search } }, { mobileNo: { contains: search } }, { aadhaarNo: { contains: search } }];
          break;
        case 'roadMaster':
          where.OR = [{ roadNo: { contains: search } }, { roadName: { contains: search } }, { roadNameMr: { contains: search } }];
          break;
        case 'propertyMaster':
          where.OR = [{ propertyNo: { contains: search } }, { ownerName: { contains: search } }, { propertyType: { contains: search } }, { citySurveyNo: { contains: search } }];
          break;
        case 'employeeMaster':
          where.OR = [{ employeeName: { contains: search } }, { employeeNameMr: { contains: search } }, { designation: { contains: search } }];
          break;
        case 'taxMaster':
          where.OR = [{ taxName: { contains: search } }, { taxNameMr: { contains: search } }, { taxType: { contains: search } }];
          break;
        case 'financialYear':
          where.OR = [{ yearLabel: { contains: search } }];
          break;
        case 'bankAccount':
          where.OR = [{ accountNo: { contains: search } }, { bankName: { contains: search } }, { branchName: { contains: search } }];
          break;
        case 'budgetHead':
          where.OR = [{ headCode: { contains: search } }, { headName: { contains: search } }, { headNameMr: { contains: search } }, { category: { contains: search } }];
          break;
        case 'schemeInfo':
          where.OR = [{ schemeName: { contains: search } }, { schemeNameMr: { contains: search } }, { schemeCode: { contains: search } }];
          break;
        case 'contractorMaster':
          where.OR = [{ contractorName: { contains: search } }, { contractorNameMr: { contains: search } }, { mobileNo: { contains: search } }];
          break;
        case 'floorInfo':
          where.OR = [{ floorName: { contains: search } }, { floorNameMr: { contains: search } }];
          break;
        case 'taxAssessment':
          where.OR = [{ propertyId: { contains: search } }, { financialYear: { contains: search } }];
          break;
        case 'demandRegister':
          where.OR = [{ propertyId: { contains: search } }, { financialYear: { contains: search } }];
          break;
        case 'taxPayment':
          where.OR = [{ receiptNo: { contains: search } }, { collectedBy: { contains: search } }];
          break;
      }
    }

    let include: Record<string, unknown> | undefined;
    if (resolvedTable === 'propertyMaster') {
      include = {
        ward: true,
        road: true,
        owner: true,
        owners: { include: { owner: true } },
        taxRates: { include: { taxMaster: true } },
      };
    }

    let data;
    switch (resolvedTable) {
      case 'villageInfo':
        data = id ? await db.villageInfo.findUnique({ where: { id } }) : await db.villageInfo.findFirst();
        break;
      case 'wardMaster':
        data = id ? await db.wardMaster.findUnique({ where: { id } }) : await db.wardMaster.findMany({ where, orderBy: { wardNo: 'asc' } });
        break;
      case 'ownerMaster':
        data = id ? await db.ownerMaster.findUnique({ where: { id }, include: { properties: { include: { property: true } }, ownedProperties: true } }) : await db.ownerMaster.findMany({ where, orderBy: { createdAt: 'desc' } });
        break;
      case 'roadMaster':
        data = id ? await db.roadMaster.findUnique({ where: { id } }) : await db.roadMaster.findMany({ where, orderBy: { roadNo: 'asc' } });
        break;
      case 'employeeMaster':
        data = id ? await db.employeeMaster.findUnique({ where: { id } }) : await db.employeeMaster.findMany({ where, orderBy: { createdAt: 'desc' } });
        break;
      case 'taxMaster':
        data = id ? await db.taxMaster.findUnique({ where: { id } }) : await db.taxMaster.findMany({ where, orderBy: { order: 'asc' } });
        break;
      case 'propertyMaster':
        data = id ? await db.propertyMaster.findUnique({ where: { id }, include }) : await db.propertyMaster.findMany({ where, include, orderBy: { createdAt: 'desc' } });
        break;
      case 'financialYear':
        data = id ? await db.financialYear.findUnique({ where: { id } }) : await db.financialYear.findMany({ where, orderBy: { yearLabel: 'desc' } });
        break;
      case 'bankAccount':
        data = id ? await db.bankAccount.findUnique({ where: { id } }) : await db.bankAccount.findMany({ where, orderBy: { bankName: 'asc' } });
        break;
      case 'budgetHead':
        data = id ? await db.budgetHead.findUnique({ where: { id }, include: { budgetEntries: true } }) : await db.budgetHead.findMany({ where, orderBy: { headCode: 'asc' }, include: { budgetEntries: true } });
        break;
      case 'schemeInfo':
        data = id ? await db.schemeInfo.findUnique({ where: { id }, include: { fundEntries: true } }) : await db.schemeInfo.findMany({ where, orderBy: { createdAt: 'desc' }, include: { fundEntries: true } });
        break;
      case 'contractorMaster':
        data = id ? await db.contractorMaster.findUnique({ where: { id } }) : await db.contractorMaster.findMany({ where, orderBy: { createdAt: 'desc' } });
        break;
      case 'floorInfo':
        data = id ? await db.floorInfo.findUnique({ where: { id } }) : await db.floorInfo.findMany({ where, orderBy: { floorNo: 'asc' } });
        break;
      case 'taxAssessment':
        data = id
          ? await db.taxAssessment.findUnique({ where: { id }, include: { property: { include: { ward: true, owner: true, owners: { include: { owner: true } } } } } })
          : await db.taxAssessment.findMany({ where, include: { property: { include: { ward: true, owner: true, owners: { include: { owner: true } } } } }, orderBy: { createdAt: 'desc' } });
        break;
      case 'demandRegister':
        data = id
          ? await db.demandRegister.findUnique({ where: { id }, include: { property: { include: { ward: true, owner: true, owners: { include: { owner: true } } } }, payments: true } })
          : await db.demandRegister.findMany({ where, include: { property: { include: { ward: true, owner: true, owners: { include: { owner: true } } } }, payments: true }, orderBy: { createdAt: 'desc' } });
        break;
      case 'taxPayment':
        data = id
          ? await db.taxPayment.findUnique({ where: { id }, include: { property: { include: { ward: true, owner: true, owners: { include: { owner: true } } } }, demand: true } })
          : await db.taxPayment.findMany({ where, include: { property: { include: { ward: true, owner: true, owners: { include: { owner: true } } } }, demand: true }, orderBy: { paymentDate: 'desc' } });
        break;
      default:
        return NextResponse.json({ success: false, error: `Invalid table: ${table}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Master GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Table and data required' }, { status: 400 });
    }

    const resolvedTable = resolveTable(table);
    const result = await handleUpsert(resolvedTable, data);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('Master POST error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ success: false, error: 'डुप्लिकेट रेकॉर्ड - हा क्रमांक आधीच अस्तित्वात आहे' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to save data' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');

    if (!table || !id) {
      return NextResponse.json({ success: false, error: 'Table and ID required' }, { status: 400 });
    }

    const resolvedTable = resolveTable(table);
    await handleDelete(resolvedTable, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Master DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}

async function handleSeed(table: string) {
  const resolvedTable = resolveTable(table);

  switch (resolvedTable) {
    case 'taxMaster': {
      const existing = await db.taxMaster.count();
      if (existing > 0) return NextResponse.json({ success: true, data: { message: 'Already seeded', count: existing } });
      const taxes = [
        { taxName: 'House Tax', taxNameMr: 'गृहकर', taxType: 'general', taxRate: 10, isEnabled: true, order: 1 },
        { taxName: 'Water Tax', taxNameMr: 'पाणीकर', taxType: 'general', taxRate: 5, isEnabled: true, order: 2 },
        { taxName: 'Light Tax', taxNameMr: 'दिवाबती कर', taxType: 'general', taxRate: 5, isEnabled: true, order: 3 },
        { taxName: 'Health Tax', taxNameMr: 'आरोग्य कर', taxType: 'general', taxRate: 3, isEnabled: true, order: 4 },
        { taxName: 'Education Tax', taxNameMr: 'शिक्षण कर', taxType: 'general', taxRate: 2, isEnabled: true, order: 5 },
        { taxName: 'Tree Tax', taxNameMr: 'वृक्ष कर', taxType: 'general', taxRate: 1, isEnabled: true, order: 6 },
        { taxName: 'Employment Tax', taxNameMr: 'रोजगार कर', taxType: 'general', taxRate: 2, isEnabled: true, order: 7 },
        { taxName: 'Drainage Tax', taxNameMr: 'नाला कर', taxType: 'general', taxRate: 3, isEnabled: true, order: 8 },
        { taxName: 'Sanitation Tax', taxNameMr: 'स्वच्छता कर', taxType: 'general', taxRate: 3, isEnabled: true, order: 9 },
        { taxName: 'Fire Tax', taxNameMr: 'अग्निशामक कर', taxType: 'general', taxRate: 1, isEnabled: true, order: 10 },
        { taxName: 'Special Tax', taxNameMr: 'विशेष कर', taxType: 'general', taxRate: 2, isEnabled: false, order: 11 },
        { taxName: 'Penalty', taxNameMr: 'दंड', taxType: 'penalty', taxRate: 0, isEnabled: true, order: 12 },
        { taxName: 'Interest', taxNameMr: 'व्याज', taxType: 'interest', taxRate: 0, isEnabled: true, order: 13 },
      ];
      const created = await db.taxMaster.createMany({ data: taxes });
      return NextResponse.json({ success: true, data: { message: 'Tax masters seeded', count: created.count } });
    }
    case 'financialYear': {
      const existing = await db.financialYear.count();
      if (existing > 0) return NextResponse.json({ success: true, data: { message: 'Already seeded', count: existing } });
      const years = [
        { yearLabel: '2023-24', startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31'), isActive: false, isCurrent: false },
        { yearLabel: '2024-25', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isActive: true, isCurrent: true },
        { yearLabel: '2025-26', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), isActive: false, isCurrent: false },
      ];
      const created = await db.financialYear.createMany({ data: years });
      return NextResponse.json({ success: true, data: { message: 'Financial years seeded', count: created.count } });
    }
    case 'floorInfo': {
      const existing = await db.floorInfo.count();
      if (existing > 0) return NextResponse.json({ success: true, data: { message: 'Already seeded', count: existing } });
      const floors = [
        { floorNo: 0, floorName: 'Ground Floor', floorNameMr: 'तळमजला', factor: 1.0 },
        { floorNo: 1, floorName: 'First Floor', floorNameMr: 'पहिला मजला', factor: 1.0 },
        { floorNo: 2, floorName: 'Second Floor', floorNameMr: 'दुसरा मजला', factor: 1.0 },
        { floorNo: 3, floorName: 'Third Floor', floorNameMr: 'तिसरा मजला', factor: 1.0 },
      ];
      const created = await db.floorInfo.createMany({ data: floors });
      return NextResponse.json({ success: true, data: { message: 'Floor info seeded', count: created.count } });
    }
    default:
      return NextResponse.json({ success: false, error: 'No seed for this table' }, { status: 400 });
  }
}

async function handleUpsert(table: string, data: Record<string, unknown>) {
  const isUpdate = !!data.id;
  const id = data.id as string | undefined;

  // Remove id for create
  const { id: _id, ...createData } = data;

  // Handle property special case with owners and taxRates
  if (table === 'propertyMaster') {
    const { owners, taxRates, ...propData } = data as Record<string, unknown> & {
      owners?: { ownerId: string; ownershipType: string }[];
      taxRates?: { taxMasterId: string; rate: number }[];
    };

    // Convert numeric strings to numbers
    const numericFields = ['areaSqFt', 'builtUpArea', 'depreciationRate', 'usageFactor', 'taxRate', 'houseTax', 'lightTax', 'healthTax', 'waterTax', 'totalArea', 'constructionYear'];
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
      await db.propertyMaster.update({ where: { id }, data: cleanPropData as Parameters<typeof db.propertyMaster.update>[0]['data'] });

      if (owners && Array.isArray(owners)) {
        await db.propertyOwnerMaster.deleteMany({ where: { propertyId: id } });
        for (const o of owners) {
          await db.propertyOwnerMaster.create({
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
        include: { ward: true, road: true, owner: true, owners: { include: { owner: true } }, taxRates: { include: { taxMaster: true } } },
      });
    }

    const property = await db.propertyMaster.create({ data: cleanPropData as Parameters<typeof db.propertyMaster.create>[0]['data'] });

    if (owners && Array.isArray(owners)) {
      for (const o of owners) {
        await db.propertyOwnerMaster.create({
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
      include: { ward: true, road: true, owner: true, owners: { include: { owner: true } }, taxRates: { include: { taxMaster: true } } },
    });
  }

  // Numeric field conversion for ALL tables
  const numericFieldsForTable: Record<string, string[]> = {
    wardMaster: ['wardNo', 'population', 'households', 'area'],
    ownerMaster: [],
    roadMaster: ['lengthM', 'widthM'],
    employeeMaster: ['basicPay', 'da', 'hra', 'grossSalary'],
    taxMaster: ['taxRate', 'order'],
    villageInfo: ['population', 'totalArea'],
    bankAccount: ['balance', 'openingBalance'],
    budgetHead: ['budgetAmount', 'revisedAmount', 'expenditure', 'balance'],
    schemeInfo: ['grantAmount', 'receivedAmount', 'expenditure', 'balance'],
    contractorMaster: [],
    financialYear: [],
    floorInfo: ['floorNo', 'factor'],
    taxAssessment: ['propertyTax', 'waterTax', 'lightTax', 'professionTax', 'miscTax', 'totalTax', 'concession', 'netDemand', 'totalArea', 'landRate', 'buildingRate', 'constructionRate', 'depreciationRate', 'usageFactor', 'capitalValue', 'taxRatePercent', 'houseTaxAmt', 'lightTaxAmt', 'healthTaxAmt', 'waterTaxAmt', 'totalTaxAmt'],
    demandRegister: ['openingBalance', 'totalDemand', 'totalCollection', 'closingBalance', 'penalty', 'discount', 'currentTax', 'previousBalance', 'interest'],
    taxPayment: ['amount', 'amountPaid', 'totalDemand', 'balance'],
  };
  const numericFields = numericFieldsForTable[table] || [];

  // Boolean fields
  const boolFieldsForTable: Record<string, string[]> = {
    ownerMaster: [],
    employeeMaster: ['isActive'],
    taxMaster: ['isEnabled'],
    bankAccount: [],
    budgetHead: [],
    schemeInfo: [],
    contractorMaster: ['isActive'],
  };
  const boolFields = boolFieldsForTable[table] || [];

  // Integer fields
  const intFieldsForTable: Record<string, string[]> = {
    wardMaster: ['wardNo', 'population', 'households'],
    propertyMaster: ['constructionYear'],
    floorInfo: ['floorNo'],
  };
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

  // Remove null values for optional fields on create
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
      case 'wardMaster': return db.wardMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.wardMaster.update>[0]['data'] });
      case 'ownerMaster': return db.ownerMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.ownerMaster.update>[0]['data'] });
      case 'roadMaster': return db.roadMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.roadMaster.update>[0]['data'] });
      case 'employeeMaster': return db.employeeMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.employeeMaster.update>[0]['data'] });
      case 'taxMaster': return db.taxMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.taxMaster.update>[0]['data'] });
      case 'villageInfo': return db.villageInfo.update({ where: { id }, data: cleanData as Parameters<typeof db.villageInfo.update>[0]['data'] });
      case 'financialYear': return db.financialYear.update({ where: { id }, data: cleanData as Parameters<typeof db.financialYear.update>[0]['data'] });
      case 'bankAccount': return db.bankAccount.update({ where: { id }, data: cleanData as Parameters<typeof db.bankAccount.update>[0]['data'] });
      case 'budgetHead': return db.budgetHead.update({ where: { id }, data: cleanData as Parameters<typeof db.budgetHead.update>[0]['data'] });
      case 'schemeInfo': return db.schemeInfo.update({ where: { id }, data: cleanData as Parameters<typeof db.schemeInfo.update>[0]['data'] });
      case 'floorInfo': return db.floorInfo.update({ where: { id }, data: cleanData as Parameters<typeof db.floorInfo.update>[0]['data'] });
      case 'contractorMaster': return db.contractorMaster.update({ where: { id }, data: cleanData as Parameters<typeof db.contractorMaster.update>[0]['data'] });
      case 'taxAssessment': return db.taxAssessment.update({ where: { id }, data: cleanData as Parameters<typeof db.taxAssessment.update>[0]['data'] });
      case 'demandRegister': return db.demandRegister.update({ where: { id }, data: cleanData as Parameters<typeof db.demandRegister.update>[0]['data'] });
      case 'taxPayment': return db.taxPayment.update({ where: { id }, data: cleanData as Parameters<typeof db.taxPayment.update>[0]['data'] });
    }
  }

  // Create
  switch (table) {
    case 'wardMaster': return db.wardMaster.create({ data: cleanData as Parameters<typeof db.wardMaster.create>[0]['data'] });
    case 'ownerMaster': return db.ownerMaster.create({ data: cleanData as Parameters<typeof db.ownerMaster.create>[0]['data'] });
    case 'roadMaster': return db.roadMaster.create({ data: cleanData as Parameters<typeof db.roadMaster.create>[0]['data'] });
    case 'employeeMaster': return db.employeeMaster.create({ data: cleanData as Parameters<typeof db.employeeMaster.create>[0]['data'] });
    case 'taxMaster': return db.taxMaster.create({ data: cleanData as Parameters<typeof db.taxMaster.create>[0]['data'] });
    case 'villageInfo': return db.villageInfo.create({ data: cleanData as Parameters<typeof db.villageInfo.create>[0]['data'] });
    case 'financialYear': return db.financialYear.create({ data: cleanData as Parameters<typeof db.financialYear.create>[0]['data'] });
    case 'bankAccount': return db.bankAccount.create({ data: cleanData as Parameters<typeof db.bankAccount.create>[0]['data'] });
    case 'budgetHead': return db.budgetHead.create({ data: cleanData as Parameters<typeof db.budgetHead.create>[0]['data'] });
    case 'schemeInfo': return db.schemeInfo.create({ data: cleanData as Parameters<typeof db.schemeInfo.create>[0]['data'] });
    case 'floorInfo': return db.floorInfo.create({ data: cleanData as Parameters<typeof db.floorInfo.create>[0]['data'] });
    case 'contractorMaster': return db.contractorMaster.create({ data: cleanData as Parameters<typeof db.contractorMaster.create>[0]['data'] });
    case 'taxAssessment': return db.taxAssessment.create({ data: cleanData as Parameters<typeof db.taxAssessment.create>[0]['data'] });
    case 'demandRegister': return db.demandRegister.create({ data: cleanData as Parameters<typeof db.demandRegister.create>[0]['data'] });
    case 'taxPayment': return db.taxPayment.create({ data: cleanData as Parameters<typeof db.taxPayment.create>[0]['data'] });
    default: throw new Error(`Unknown table: ${table}`);
  }
}

async function handleDelete(table: string, id: string) {
  switch (table) {
    case 'wardMaster': return db.wardMaster.delete({ where: { id } });
    case 'ownerMaster': return db.ownerMaster.delete({ where: { id } });
    case 'roadMaster': return db.roadMaster.delete({ where: { id } });
    case 'employeeMaster': return db.employeeMaster.delete({ where: { id } });
    case 'taxMaster': return db.taxMaster.delete({ where: { id } });
    case 'propertyMaster': return db.propertyMaster.delete({ where: { id } });
    case 'villageInfo': return db.villageInfo.delete({ where: { id } });
    case 'financialYear': return db.financialYear.delete({ where: { id } });
    case 'bankAccount': return db.bankAccount.delete({ where: { id } });
    case 'budgetHead': return db.budgetHead.delete({ where: { id } });
    case 'schemeInfo': return db.schemeInfo.delete({ where: { id } });
    case 'floorInfo': return db.floorInfo.delete({ where: { id } });
    case 'contractorMaster': return db.contractorMaster.delete({ where: { id } });
    case 'taxAssessment': return db.taxAssessment.delete({ where: { id } });
    case 'demandRegister': return db.demandRegister.delete({ where: { id } });
    case 'taxPayment': return db.taxPayment.delete({ where: { id } });
    default: throw new Error(`Unknown table: ${table}`);
  }
}
