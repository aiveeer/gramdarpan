import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Field type definitions for proper data conversion
type FieldType = 'string' | 'number' | 'boolean' | 'float' | 'nullableString';

interface FieldDef {
  name: string;
  type: FieldType;
  required?: boolean;
}

const TABLE_FIELDS: Record<string, FieldDef[]> = {
  ward: [
    { name: 'wardNumber', type: 'string', required: true },
    { name: 'wardName', type: 'string', required: true },
    { name: 'wardNameMr', type: 'string' },
    { name: 'population', type: 'number' },
    { name: 'area', type: 'float' },
    { name: 'description', type: 'nullableString' },
  ],
  owner: [
    { name: 'ownerNumber', type: 'string', required: true },
    { name: 'firstName', type: 'string', required: true },
    { name: 'middleName', type: 'nullableString' },
    { name: 'lastName', type: 'string', required: true },
    { name: 'firstNameMr', type: 'string' },
    { name: 'middleNameMr', type: 'nullableString' },
    { name: 'lastNameMr', type: 'nullableString' },
    { name: 'mobileNumber', type: 'nullableString' },
    { name: 'aadhaarNumber', type: 'nullableString' },
    { name: 'panNumber', type: 'nullableString' },
    { name: 'email', type: 'nullableString' },
    { name: 'address', type: 'nullableString' },
    { name: 'addressMr', type: 'nullableString' },
    { name: 'isDisabled', type: 'boolean' },
    { name: 'disabilityType', type: 'nullableString' },
    { name: 'disabilityPercentage', type: 'float' },
  ],
  road: [
    { name: 'roadNumber', type: 'string', required: true },
    { name: 'roadName', type: 'string', required: true },
    { name: 'roadNameMr', type: 'string' },
    { name: 'roadType', type: 'nullableString' },
    { name: 'length', type: 'float' },
    { name: 'width', type: 'float' },
  ],
  drainage: [
    { name: 'drainageNumber', type: 'string', required: true },
    { name: 'drainageName', type: 'string', required: true },
    { name: 'drainageNameMr', type: 'string' },
    { name: 'drainageType', type: 'nullableString' },
    { name: 'length', type: 'float' },
    { name: 'status', type: 'string' },
  ],
  waterSupply: [
    { name: 'connectionNumber', type: 'string', required: true },
    { name: 'connectionType', type: 'string', required: true },
    { name: 'connectionStatus', type: 'string' },
    { name: 'tapSize', type: 'nullableString' },
    { name: 'monthlyRate', type: 'float' },
  ],
  streetLight: [
    { name: 'lightNumber', type: 'string', required: true },
    { name: 'lightType', type: 'string', required: true },
    { name: 'wattage', type: 'float' },
    { name: 'poleNumber', type: 'nullableString' },
    { name: 'status', type: 'string' },
  ],
  readyReckoner: [
    { name: 'usageType', type: 'string', required: true },
    { name: 'constructionType', type: 'string', required: true },
    { name: 'ratePerSqFt', type: 'float', required: true },
    { name: 'year', type: 'string', required: true },
    { name: 'zone', type: 'nullableString' },
  ],
  disability: [
    { name: 'disabilityType', type: 'string', required: true },
    { name: 'disabilityTypeMr', type: 'string', required: true },
    { name: 'percentageRange', type: 'string', required: true },
    { name: 'description', type: 'nullableString' },
  ],
  employee: [
    { name: 'employeeId', type: 'string', required: true },
    { name: 'firstName', type: 'string', required: true },
    { name: 'middleName', type: 'nullableString' },
    { name: 'lastName', type: 'string', required: true },
    { name: 'firstNameMr', type: 'string' },
    { name: 'middleNameMr', type: 'nullableString' },
    { name: 'lastNameMr', type: 'nullableString' },
    { name: 'designation', type: 'string', required: true },
    { name: 'designationMr', type: 'nullableString' },
    { name: 'mobileNumber', type: 'nullableString' },
    { name: 'aadhaarNumber', type: 'nullableString' },
    { name: 'joinDate', type: 'nullableString' },
    { name: 'salary', type: 'float' },
    { name: 'isActive', type: 'boolean' },
  ],
  tax: [
    { name: 'name', type: 'string', required: true },
    { name: 'nameMarathi', type: 'string', required: true },
    { name: 'rate', type: 'float' },
    { name: 'isEnabled', type: 'boolean' },
    { name: 'order', type: 'number' },
    { name: 'category', type: 'string' },
  ],
  property: [
    { name: 'propertyNumber', type: 'string', required: true },
    { name: 'wardNumber', type: 'string' }, // lookup by wardNumber
    { name: 'roadNumber', type: 'string' }, // lookup by roadNumber
    { name: 'citySurveyNo', type: 'nullableString' },
    { name: 'area', type: 'float' },
    { name: 'builtUpArea', type: 'float' },
    { name: 'boundaries', type: 'nullableString' },
    { name: 'constructionType', type: 'nullableString' },
    { name: 'usageType', type: 'nullableString' },
    { name: 'floorInfo', type: 'nullableString' },
    { name: 'yearBuilt', type: 'nullableString' },
    { name: 'propertyStatus', type: 'string' },
  ],
};

function convertValue(value: string | undefined, type: FieldType): unknown {
  if (value === undefined || value === '') {
    if (type === 'string' || type === 'nullableString') return type === 'string' ? '' : null;
    if (type === 'boolean') return false;
    return null;
  }

  switch (type) {
    case 'number':
      const num = parseInt(value, 10);
      return isNaN(num) ? null : num;
    case 'float':
      const float = parseFloat(value);
      return isNaN(float) ? null : float;
    case 'boolean':
      return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'होय';
    case 'nullableString':
      return value || null;
    case 'string':
    default:
      return value;
  }
}

interface ImportError {
  row: number;
  message: string;
  data?: Record<string, unknown>;
}

async function resolveForeignKeyLookups(table: string, record: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (table === 'property') {
    const result = { ...record };

    // Look up wardId by wardNumber
    if (result.wardNumber) {
      const ward = await db.wardMaster.findUnique({ where: { wardNumber: String(result.wardNumber) } });
      if (ward) {
        result.wardId = ward.id;
      } else {
        result.wardId = null;
      }
    } else {
      result.wardId = null;
    }

    // Look up roadId by roadNumber
    if (result.roadNumber) {
      const road = await db.roadMaster.findUnique({ where: { roadNumber: String(result.roadNumber) } });
      if (road) {
        result.roadId = road.id;
      } else {
        result.roadId = null;
      }
    } else {
      result.roadId = null;
    }

    // Remove the lookup fields that are not in the Prisma model
    delete result.wardNumber;
    delete result.roadNumber;

    return result;
  }

  return record;
}

async function createRecord(table: string, data: Record<string, unknown>): Promise<unknown> {
  const cleanData = { ...data };
  delete cleanData.id;

  switch (table) {
    case 'ward':
      return db.wardMaster.create({ data: cleanData });
    case 'owner':
      return db.ownerMaster.create({ data: cleanData });
    case 'road':
      return db.roadMaster.create({ data: cleanData });
    case 'drainage':
      return db.drainageMaster.create({ data: cleanData });
    case 'waterSupply':
      return db.waterSupplyMaster.create({ data: cleanData });
    case 'streetLight':
      return db.streetLightMaster.create({ data: cleanData });
    case 'readyReckoner':
      return db.readyReckonerMaster.create({ data: cleanData });
    case 'disability':
      return db.disabilityMaster.create({ data: cleanData });
    case 'employee':
      return db.employeeMaster.create({ data: cleanData });
    case 'tax':
      return db.taxMaster.create({ data: cleanData });
    case 'property':
      return db.propertyMaster.create({ data: cleanData });
    default:
      throw new Error(`Unknown table: ${table}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, data } = body as { table: string; data: Record<string, string>[] };

    if (!table || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Table name and data array required' }, { status: 400 });
    }

    const fields = TABLE_FIELDS[table];
    if (!fields) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because row 1 is headers

      try {
        // Validate required fields
        const missingRequired = fields
          .filter((f) => f.required)
          .filter((f) => !row[f.name] || row[f.name].trim() === '');

        if (missingRequired.length > 0) {
          errors.push({
            row: rowNum,
            message: `आवश्यक फील्ड रिक्त: ${missingRequired.map((f) => f.name).join(', ')}`,
            data: row,
          });
          errorCount++;
          continue;
        }

        // Convert types
        const convertedRecord: Record<string, unknown> = {};
        for (const field of fields) {
          if (field.name === 'wardNumber' || field.name === 'roadNumber') {
            // Keep these for foreign key lookup (property table)
            convertedRecord[field.name] = row[field.name] || '';
          } else {
            convertedRecord[field.name] = convertValue(row[field.name], field.type);
          }
        }

        // Resolve foreign key lookups
        const resolvedRecord = await resolveForeignKeyLookups(table, convertedRecord);

        // Create the record
        await createRecord(table, resolvedRecord);
        successCount++;
      } catch (err: unknown) {
        let message = 'अज्ञात त्रुटी';
        if (err && typeof err === 'object' && 'message' in err) {
          const errMsg = (err as { message: string }).message;
          if (errMsg.includes('Unique') || errMsg.includes('unique') || (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002')) {
            message = 'डुप्लिकेट रेकॉर्ड - हा क्रमांक आधीच अस्तित्वात आहे';
          } else {
            message = errMsg;
          }
        }
        errors.push({
          row: rowNum,
          message,
          data: row,
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      successCount,
      errorCount,
      totalRows: data.length,
      errors,
    });
  } catch (error) {
    console.error('Excel import error:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
