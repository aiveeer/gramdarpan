import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Construction types as per Namuna 8 Excel format with their ready reckoner rates
const CONSTRUCTION_TYPES = [
  { type: 'झोपडी किंवा मातीचे घर', key: 'zopdi', defaultRate: 6403 },
  { type: 'दगड विटा/मातीचे बांधकाम', key: 'dagadMati', defaultRate: 9979 },
  { type: 'दगड विट/सिमेंटचे बांधकाम', key: 'dagadCement', defaultRate: 14923 },
  { type: 'आर.सि.सि. बांधकाम', key: 'rcc', defaultRate: 17424 },
  { type: 'पहिला मजला', key: 'firstFloor', defaultRate: 34848 },
  { type: 'जमीन/खुली जागा', key: 'openLand', defaultRate: 1310 },
];

// Normalize a Prisma PropertyMaster result to match frontend PropertyInfo interface
// The frontend uses `propertyNumber` but Prisma model has `propertyNo`, etc.
function normalizeProperty(p: Record<string, unknown>) {
  if (!p) return p;

  // Parse boundaries JSON if it's a string
  let boundaryData: Record<string, unknown> = {};
  if (typeof p.boundaries === 'string') {
    try { boundaryData = JSON.parse(p.boundaries); } catch { /* ignore */ }
  }

  // Parse floorInfo JSON if it's a string
  let totalLength: number | undefined;
  let totalWidth: number | undefined;
  if (typeof p.floorInfo === 'string') {
    try {
      const fi = JSON.parse(p.floorInfo);
      totalLength = fi.totalLength;
      totalWidth = fi.totalWidth;
    } catch { /* ignore */ }
  }

  return {
    id: p.id,
    propertyNumber: p.propertyNo || '',
    area: p.area ?? null,
    builtUpArea: p.builtUpArea ?? null,
    constructionType: p.constructionType ?? null,
    usageType: p.usageType ?? null,
    citySurveyNo: p.citySurveyNo ?? null,
    boundaryEast: boundaryData.boundaryEast ?? undefined,
    boundaryWest: boundaryData.boundaryWest ?? undefined,
    boundarySouth: boundaryData.boundarySouth ?? undefined,
    boundaryNorth: boundaryData.boundaryNorth ?? undefined,
    lengthEast: boundaryData.lengthEast ?? undefined,
    widthEast: boundaryData.widthEast ?? undefined,
    lengthWest: boundaryData.lengthWest ?? undefined,
    widthWest: boundaryData.widthWest ?? undefined,
    lengthSouth: boundaryData.lengthSouth ?? undefined,
    widthSouth: boundaryData.widthSouth ?? undefined,
    lengthNorth: boundaryData.lengthNorth ?? undefined,
    widthNorth: boundaryData.widthNorth ?? undefined,
    totalLength,
    totalWidth,
    depreciationRate: p.depreciationRate ?? undefined,
    usageFactor: p.usageFactor ?? undefined,
    taxRate: p.taxRate ?? undefined,
    houseTax: p.houseTax ?? undefined,
    lightTax: p.lightTax ?? undefined,
    healthTax: p.healthTax ?? undefined,
    waterTax: p.waterTax ?? undefined,
    constructionDetails: p.constructionDetails ?? undefined,
    yearBuilt: p.yearBuilt ?? undefined,
    ward: p.ward ? {
      wardNameMr: (p.ward as Record<string, unknown>).wardNameMr ?? '',
      wardNumber: (p.ward as Record<string, unknown>).wardNumber ?? (p.ward as Record<string, unknown>).wardNo?.toString() ?? '',
      wardName: (p.ward as Record<string, unknown>).wardName ?? '',
    } : undefined,
    road: p.road ? {
      roadNameMr: (p.road as Record<string, unknown>).roadNameMr ?? '',
      roadNumber: (p.road as Record<string, unknown>).roadNo ?? '',
      roadName: (p.road as Record<string, unknown>).roadName ?? '',
    } : undefined,
    owners: Array.isArray(p.owners)
      ? p.owners.map((o: Record<string, unknown>) => ({
          owner: {
            firstName: (o.owner as Record<string, unknown>)?.firstName ?? '',
            lastName: (o.owner as Record<string, unknown>)?.lastName ?? '',
            firstNameMr: (o.owner as Record<string, unknown>)?.firstNameMr ?? '',
            lastNameMr: (o.owner as Record<string, unknown>)?.lastNameMr ?? '',
          },
          ownershipType: o.ownershipType ?? 'मालक',
        }))
      : [],
    taxRates: Array.isArray(p.taxRates)
      ? p.taxRates.map((tr: Record<string, unknown>) => ({
          taxMasterId: tr.taxMasterId ?? '',
          rate: tr.rate ?? 0,
          taxMaster: {
            name: (tr.taxMaster as Record<string, unknown>)?.name ?? '',
            nameMarathi: (tr.taxMaster as Record<string, unknown>)?.nameMarathi ?? '',
            isEnabled: (tr.taxMaster as Record<string, unknown>)?.isEnabled ?? true,
            order: (tr.taxMaster as Record<string, unknown>)?.order ?? 0,
            category: '',
          },
        }))
      : [],
  };
}

// Normalize a Namuna8 record with its included property
function normalizeRecord(r: Record<string, unknown>) {
  return {
    id: r.id,
    propertyId: r.propertyId,
    financialYear: r.financialYear,
    taxDetails: r.taxDetails ?? '',
    totalTax: r.totalTax ?? 0,
    totalArea: r.totalArea ?? undefined,
    landRate: r.landRate ?? undefined,
    buildingRate: r.buildingRate ?? undefined,
    constructionRate: r.constructionRate ?? undefined,
    depreciationRate: r.depreciationRate ?? undefined,
    usageFactor: r.usageFactor ?? undefined,
    capitalValue: r.capitalValue ?? undefined,
    taxRatePercent: r.taxRatePercent ?? undefined,
    houseTaxAmt: r.houseTaxAmt ?? undefined,
    lightTaxAmt: r.lightTaxAmt ?? undefined,
    healthTaxAmt: r.healthTaxAmt ?? undefined,
    waterTaxAmt: r.waterTaxAmt ?? undefined,
    totalTaxAmt: r.totalTaxAmt ?? undefined,
    constructionDetails: r.constructionDetails ?? r.constructionDetailsStr ?? undefined,
    appealHouseTax: r.appealHouseTax ?? undefined,
    appealLightTax: r.appealLightTax ?? undefined,
    appealHealthTax: r.appealHealthTax ?? undefined,
    appealWaterTax: r.appealWaterTax ?? undefined,
    appealTotalTax: r.appealTotalTax ?? undefined,
    remarks: r.remarks ?? undefined,
    property: normalizeProperty(r.property),
  };
}

const propertyIncludeConfig = {
  ward: true,
  road: true,
  owner: true,
  owners: { include: { owner: true } },
  taxRates: { include: { taxMaster: true } },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const financialYear = searchParams.get('financialYear');

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (financialYear) where.financialYear = financialYear;

    const records = await db.namuna8.findMany({
      where,
      include: {
        property: {
          include: propertyIncludeConfig,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Normalize each record to match frontend interface
    const normalized = records.map((r) => normalizeRecord(r as unknown as Record<string, unknown>));
    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching Namuna 8:', error);
    // Always return an array, even on error
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, financialYear } = body;
    if (!propertyId || !financialYear) {
      return NextResponse.json({ error: 'Property ID and Financial Year required' }, { status: 400 });
    }

    const property = await db.propertyMaster.findUnique({
      where: { id: propertyId },
      include: propertyIncludeConfig,
    });

    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    // Parse construction details from property
    let constructionDetails: { type: string; rate: number; area: number; capitalValue: number; taxAmount: number }[] = [];
    try {
      constructionDetails = property.constructionDetails ? JSON.parse(property.constructionDetails) : [];
    } catch { /* ignore parse error */ }

    // If no construction details, create default ones based on construction type
    if (constructionDetails.length === 0) {
      constructionDetails = CONSTRUCTION_TYPES.map(ct => ({
        type: ct.type,
        rate: ct.defaultRate,
        area: 0,
        capitalValue: 0,
        taxAmount: 0,
      }));
    }

    // Calculate tax for each construction type
    const area = property.area || property.builtUpArea || 0;
    const depreciationRate = property.depreciationRate || 0;
    const usageFactor = property.usageFactor || 1;
    const taxRatePercent = property.taxRate || 0;

    let totalCapitalValue = 0;

    constructionDetails = constructionDetails.map(cd => {
      // Capital Value = Area × Rate × (1 - Depreciation) × Usage Factor
      const effectiveArea = cd.area || area;
      const capitalValue = effectiveArea * cd.rate * (1 - depreciationRate) * usageFactor;
      totalCapitalValue += capitalValue;
      // Tax Amount = Capital Value × Tax Rate / 1000
      const taxAmount = capitalValue * taxRatePercent / 1000;
      return {
        ...cd,
        area: effectiveArea,
        capitalValue: Math.round(capitalValue * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
      };
    });

    // Main tax calculation (from the primary construction type)
    const primaryConstruction = constructionDetails.find(cd => cd.area > 0) || constructionDetails[0];
    const houseTaxAmt = property.houseTax || primaryConstruction?.taxAmount || 0;
    const lightTaxAmt = property.lightTax || 0;
    const healthTaxAmt = property.healthTax || 0;
    const waterTaxAmt = property.waterTax || 0;
    const totalTaxAmt = Math.round((houseTaxAmt + lightTaxAmt + healthTaxAmt + waterTaxAmt) * 100) / 100;

    // Build tax details for compatibility
    const taxDetails: { taxMasterId: string; taxName: string; taxNameMarathi: string; rate: number; amount: number }[] = [
      { taxMasterId: 'house', taxName: 'House Tax', taxNameMarathi: 'घरपट्टी', rate: taxRatePercent, amount: houseTaxAmt },
      { taxMasterId: 'light', taxName: 'Light Tax', taxNameMarathi: 'दिवाबत्ती कर', rate: 0, amount: lightTaxAmt },
      { taxMasterId: 'health', taxName: 'Health Tax', taxNameMarathi: 'आरोग्यरक्षण कर', rate: 0, amount: healthTaxAmt },
      { taxMasterId: 'water', taxName: 'Water Tax', taxNameMarathi: 'सा. पाणीपट्टी', rate: 0, amount: waterTaxAmt },
    ];

    // Also include dynamic tax rates from TaxMaster
    if (Array.isArray(property.taxRates)) {
      for (const tr of property.taxRates) {
        if (!tr.taxMaster?.isEnabled) continue;
        if (['house', 'light', 'health', 'water'].includes(tr.taxMasterId)) continue;
        const amount = area * (tr.rate || 0);
        taxDetails.push({
          taxMasterId: tr.taxMasterId,
          taxName: tr.taxMaster?.name || '',
          taxNameMarathi: tr.taxMaster?.nameMarathi || '',
          rate: tr.rate || 0,
          amount: Math.round(amount * 100) / 100,
        });
      }
    }

    const existing = await db.namuna8.findFirst({ where: { propertyId, financialYear } });

    const recordData = {
      taxDetails: JSON.stringify(taxDetails),
      totalTax: totalTaxAmt,
      totalArea: area,
      landRate: constructionDetails.find(cd => cd.type === 'जमीन/खुली जागा')?.rate || 1310,
      buildingRate: constructionDetails.find(cd => cd.type === 'आर.सि.सि. बांधकाम')?.rate || 17424,
      constructionRate: primaryConstruction?.rate || 0,
      depreciationRate,
      usageFactor,
      capitalValue: Math.round(totalCapitalValue * 100) / 100,
      taxRatePercent,
      houseTaxAmt,
      lightTaxAmt,
      healthTaxAmt,
      waterTaxAmt,
      totalTaxAmt,
      constructionDetailsStr: JSON.stringify(constructionDetails),
      appealHouseTax: 0,
      appealLightTax: 0,
      appealHealthTax: 0,
      appealWaterTax: 0,
      appealTotalTax: 0,
      remarks: '',
    };

    const includeConfig = {
      property: {
        include: propertyIncludeConfig,
      },
    };

    let result;
    if (existing) {
      result = await db.namuna8.update({ where: { id: existing.id }, data: recordData, include: includeConfig });
    } else {
      result = await db.namuna8.create({
        data: { propertyId, financialYear, ...recordData },
        include: includeConfig,
      });
    }

    return NextResponse.json(normalizeRecord(result as unknown as Record<string, unknown>), { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Error generating Namuna 8:', error);
    return NextResponse.json({ error: 'Failed to generate Namuna 8 record' }, { status: 500 });
  }
}
