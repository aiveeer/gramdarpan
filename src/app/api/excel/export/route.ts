import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Table config: field definitions for CSV export
const TABLE_CONFIG: Record<string, { label: string; fields: string[]; prismaModel: string }> = {
  ward: {
    label: 'वार्ड',
    fields: ['wardNumber', 'wardName', 'wardNameMr', 'population', 'area', 'description'],
    prismaModel: 'wardMaster',
  },
  owner: {
    label: 'मालक',
    fields: ['ownerNumber', 'firstName', 'middleName', 'lastName', 'firstNameMr', 'middleNameMr', 'lastNameMr', 'mobileNumber', 'aadhaarNumber', 'panNumber', 'email', 'address', 'addressMr', 'isDisabled', 'disabilityType', 'disabilityPercentage'],
    prismaModel: 'ownerMaster',
  },
  road: {
    label: 'रस्ता',
    fields: ['roadNumber', 'roadName', 'roadNameMr', 'roadType', 'length', 'width'],
    prismaModel: 'roadMaster',
  },
  drainage: {
    label: 'नाला',
    fields: ['drainageNumber', 'drainageName', 'drainageNameMr', 'drainageType', 'length', 'status'],
    prismaModel: 'drainageMaster',
  },
  waterSupply: {
    label: 'पाणीपुरवठा',
    fields: ['connectionNumber', 'connectionType', 'connectionStatus', 'tapSize', 'monthlyRate'],
    prismaModel: 'waterSupplyMaster',
  },
  streetLight: {
    label: 'दिवाबती',
    fields: ['lightNumber', 'lightType', 'wattage', 'poleNumber', 'status'],
    prismaModel: 'streetLightMaster',
  },
  readyReckoner: {
    label: 'रेडी रेकनर',
    fields: ['usageType', 'constructionType', 'ratePerSqFt', 'year', 'zone'],
    prismaModel: 'readyReckonerMaster',
  },
  disability: {
    label: 'विकलांगता',
    fields: ['disabilityType', 'disabilityTypeMr', 'percentageRange', 'description'],
    prismaModel: 'disabilityMaster',
  },
  employee: {
    label: 'कर्मचारी',
    fields: ['employeeId', 'firstName', 'middleName', 'lastName', 'firstNameMr', 'middleNameMr', 'lastNameMr', 'designation', 'designationMr', 'mobileNumber', 'aadhaarNumber', 'joinDate', 'salary', 'isActive'],
    prismaModel: 'employeeMaster',
  },
  tax: {
    label: 'कर',
    fields: ['name', 'nameMarathi', 'rate', 'isEnabled', 'order', 'category'],
    prismaModel: 'taxMaster',
  },
  property: {
    label: 'मालमत्ता',
    fields: ['propertyNumber', 'wardNumber', 'roadNumber', 'citySurveyNo', 'area', 'builtUpArea', 'boundaries', 'constructionType', 'usageType', 'floorInfo', 'yearBuilt', 'propertyStatus'],
    prismaModel: 'propertyMaster',
  },
};

function escapeCSV(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function fetchTableData(table: string): Promise<Record<string, unknown>[]> {
  switch (table) {
    case 'ward':
      return db.wardMaster.findMany({ orderBy: { wardNumber: 'asc' } });
    case 'owner':
      return db.ownerMaster.findMany({ orderBy: { ownerNumber: 'asc' } });
    case 'road':
      return db.roadMaster.findMany({ orderBy: { roadNumber: 'asc' } });
    case 'drainage':
      return db.drainageMaster.findMany({ orderBy: { drainageNumber: 'asc' } });
    case 'waterSupply':
      return db.waterSupplyMaster.findMany({ orderBy: { connectionNumber: 'asc' } });
    case 'streetLight':
      return db.streetLightMaster.findMany({ orderBy: { lightNumber: 'asc' } });
    case 'readyReckoner':
      return db.readyReckonerMaster.findMany({ orderBy: { year: 'desc' } });
    case 'disability':
      return db.disabilityMaster.findMany();
    case 'employee':
      return db.employeeMaster.findMany({ orderBy: { employeeId: 'asc' } });
    case 'tax':
      return db.taxMaster.findMany({ orderBy: { order: 'asc' } });
    case 'property':
      return db.propertyMaster.findMany({
        orderBy: { propertyNumber: 'asc' },
        include: { ward: true, road: true },
      });
    default:
      throw new Error(`Unknown table: ${table}`);
  }
}

function mapRecordToCSV(table: string, record: Record<string, unknown>, fields: string[]): string[] {
  if (table === 'property') {
    const rec = record as Record<string, unknown> & { ward?: { wardNumber?: string }; road?: { roadNumber?: string } };
    return fields.map((field) => {
      if (field === 'wardNumber') {
        return escapeCSV(rec.ward?.wardNumber || '');
      }
      if (field === 'roadNumber') {
        return escapeCSV(rec.road?.roadNumber || '');
      }
      return escapeCSV(record[field]);
    });
  }
  return fields.map((field) => escapeCSV(record[field]));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json({ error: 'Table name required' }, { status: 400 });
    }

    const config = TABLE_CONFIG[table];
    if (!config) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    // Check if template-only request
    const templateOnly = searchParams.get('template') === 'true';

    let csv: string;

    if (templateOnly) {
      // Return headers only
      csv = config.fields.join(',') + '\n';
    } else {
      // Return full data
      const data = await fetchTableData(table);

      const headerLine = config.fields.join(',');
      const dataLines = data.map((record) =>
        mapRecordToCSV(table, record, config.fields).join(',')
      );

      csv = headerLine + '\n' + dataLines.join('\n') + (dataLines.length > 0 ? '\n' : '');
    }

    const filename = templateOnly
      ? `${table}_template.csv`
      : `${table}_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
