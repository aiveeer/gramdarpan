import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || 'all';

    if (!q) {
      return NextResponse.json({
        success: true,
        data: { properties: [], owners: [], wards: [], totalResults: 0 },
      });
    }

    const results: {
      properties: Record<string, unknown>[];
      owners: Record<string, unknown>[];
      wards: Record<string, unknown>[];
      totalResults: number;
    } = {
      properties: [],
      owners: [],
      wards: [],
      totalResults: 0,
    };

    // Search Properties
    if (category === 'all' || category === 'property') {
      const properties = await db.propertyMaster.findMany({
        where: {
          OR: [
            { propertyNo: { contains: q } },
            { ownerName: { contains: q } },
            { citySurveyNo: { contains: q } },
            { propertyType: { contains: q } },
            { propertyUse: { contains: q } },
          ],
        },
        include: {
          ward: true,
          road: true,
          owner: true,
          owners: { include: { owner: true } },
          taxRates: { include: { taxMaster: true } },
        },
        take: 20,
      });

      results.properties = properties.map((p) => {
        const primaryOwner = p.owners.find((o) => o.ownershipType === 'मालक') || p.owners[0];
        const totalTaxRate = p.taxRates.reduce((sum, tr) => sum + tr.rate, 0);

        return {
          id: p.id,
          propertyNo: p.propertyNo,
          ownerName: p.ownerName,
          citySurveyNo: p.citySurveyNo,
          areaSqFt: p.areaSqFt,
          builtUpArea: p.builtUpArea,
          propertyUse: p.propertyUse,
          constructionType: p.constructionType,
          propertyStatus: p.propertyStatus,
          ward: p.ward ? { wardNo: p.ward.wardNo, wardName: p.ward.wardName, wardNameMr: p.ward.wardNameMr } : null,
          road: p.road ? { roadNo: p.road.roadNo, roadName: p.road.roadName, roadNameMr: p.road.roadNameMr } : null,
          owner: primaryOwner?.owner ? { id: primaryOwner.owner.id, ownerName: primaryOwner.owner.ownerName, ownershipType: primaryOwner.ownershipType } : null,
          totalTaxRate,
          taxDetails: p.taxRates.map((tr) => ({
            taxName: tr.taxMaster.taxName,
            taxNameMr: tr.taxMaster.taxNameMr,
            rate: tr.rate,
          })),
          ownersCount: p.owners.length,
        };
      });
    }

    // Search Owners
    if (category === 'all' || category === 'owner') {
      const owners = await db.ownerMaster.findMany({
        where: {
          OR: [
            { ownerName: { contains: q } },
            { ownerNameMr: { contains: q } },
            { mobileNo: { contains: q } },
            { aadhaarNo: { contains: q } },
          ],
        },
        include: {
          properties: { include: { property: { include: { ward: true } } } },
          ownedProperties: true,
        },
        take: 20,
      });

      results.owners = owners.map((o) => ({
        id: o.id,
        ownerName: o.ownerName,
        ownerNameMr: o.ownerNameMr,
        mobileNo: o.mobileNo,
        aadhaarNo: o.aadhaarNo,
        linkedProperties: o.ownedProperties.length,
      }));
    }

    // Search Wards
    if (category === 'all' || category === 'ward') {
      const wards = await db.wardMaster.findMany({
        where: {
          OR: [
            { wardNo: { contains: q } },
            { wardName: { contains: q } },
            { wardNameMr: { contains: q } },
          ],
        },
        include: {
          properties: { select: { id: true, propertyNo: true, propertyUse: true, areaSqFt: true, propertyStatus: true } },
        },
        take: 20,
      });

      results.wards = wards.map((w) => ({
        id: w.id,
        wardNo: w.wardNo,
        wardName: w.wardName,
        wardNameMr: w.wardNameMr,
        population: w.population,
        area: w.area,
        propertiesCount: w.properties.length,
      }));
    }

    results.totalResults =
      results.properties.length + results.owners.length + results.wards.length;

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'शोध विफल झाला', data: { properties: [], owners: [], wards: [], totalResults: 0 } },
      { status: 500 }
    );
  }
}
