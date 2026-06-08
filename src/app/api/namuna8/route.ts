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
          include: {
            ward: true,
            road: true,
            owners: { include: { owner: true } },
            taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching Namuna 8:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { propertyId, financialYear } = await request.json();
    if (!propertyId || !financialYear) {
      return NextResponse.json({ error: 'Property ID and Financial Year required' }, { status: 400 });
    }

    const property = await db.propertyMaster.findUnique({
      where: { id: propertyId },
      include: {
        ward: true,
        road: true,
        owners: { include: { owner: true } },
        taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } },
      },
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
    const houseTaxAmt = property.houseTax || primaryConstruction.taxAmount || 0;
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
    for (const tr of property.taxRates) {
      if (!tr.taxMaster.isEnabled) continue;
      if (['house', 'light', 'health', 'water'].includes(tr.taxMasterId)) continue;
      const amount = area * tr.rate;
      taxDetails.push({
        taxMasterId: tr.taxMasterId,
        taxName: tr.taxMaster.name,
        taxNameMarathi: tr.taxMaster.nameMarathi,
        rate: tr.rate,
        amount: Math.round(amount * 100) / 100,
      });
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
      constructionDetails: JSON.stringify(constructionDetails),
      appealHouseTax: 0,
      appealLightTax: 0,
      appealHealthTax: 0,
      appealWaterTax: 0,
      appealTotalTax: 0,
      remarks: '',
    };

    const includeConfig = {
      property: {
        include: {
          ward: true,
          road: true,
          owners: { include: { owner: true } },
          taxRates: { include: { taxMaster: true }, orderBy: { taxMaster: { order: 'asc' } } },
        },
      },
    };

    if (existing) {
      return NextResponse.json(
        await db.namuna8.update({ where: { id: existing.id }, data: recordData, include: includeConfig })
      );
    }

    return NextResponse.json(
      await db.namuna8.create({
        data: { propertyId, financialYear, ...recordData },
        include: includeConfig,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating Namuna 8:', error);
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}
