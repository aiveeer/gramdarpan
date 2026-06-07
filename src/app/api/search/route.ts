import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || 'all';

    if (!q) {
      return NextResponse.json({
        properties: [],
        owners: [],
        wards: [],
        totalResults: 0,
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
            { propertyNumber: { contains: q } },
            { citySurveyNo: { contains: q } },
            { usageType: { contains: q } },
            { constructionType: { contains: q } },
            { propertyStatus: { contains: q } },
          ],
        },
        include: {
          ward: true,
          road: true,
          owners: {
            include: {
              owner: true,
            },
          },
          taxRates: {
            include: {
              taxMaster: true,
            },
          },
        },
        take: 20,
      });

      results.properties = properties.map((p) => {
        const primaryOwner = p.owners.find((o) => o.ownershipType === 'मालक') || p.owners[0];
        const totalTaxRate = p.taxRates.reduce((sum, tr) => sum + tr.rate, 0);

        return {
          id: p.id,
          propertyNumber: p.propertyNumber,
          citySurveyNo: p.citySurveyNo,
          area: p.area,
          builtUpArea: p.builtUpArea,
          usageType: p.usageType,
          constructionType: p.constructionType,
          floorInfo: p.floorInfo,
          yearBuilt: p.yearBuilt,
          propertyStatus: p.propertyStatus,
          ward: p.ward
            ? {
                wardNumber: p.ward.wardNumber,
                wardName: p.ward.wardName,
                wardNameMr: p.ward.wardNameMr,
              }
            : null,
          road: p.road
            ? {
                roadNumber: p.road.roadNumber,
                roadName: p.road.roadName,
                roadNameMr: p.road.roadNameMr,
              }
            : null,
          owner: primaryOwner?.owner
            ? {
                id: primaryOwner.owner.id,
                ownerNumber: primaryOwner.owner.ownerNumber,
                firstName: primaryOwner.owner.firstName,
                middleName: primaryOwner.owner.middleName,
                lastName: primaryOwner.owner.lastName,
                firstNameMr: primaryOwner.owner.firstNameMr,
                middleNameMr: primaryOwner.owner.middleNameMr,
                lastNameMr: primaryOwner.owner.lastNameMr,
                ownershipType: primaryOwner.ownershipType,
              }
            : null,
          totalTaxRate,
          taxDetails: p.taxRates.map((tr) => ({
            name: tr.taxMaster.name,
            nameMarathi: tr.taxMaster.nameMarathi,
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
            { firstName: { contains: q } },
            { middleName: { contains: q } },
            { lastName: { contains: q } },
            { firstNameMr: { contains: q } },
            { middleNameMr: { contains: q } },
            { lastNameMr: { contains: q } },
            { mobileNumber: { contains: q } },
            { aadhaarNumber: { contains: q } },
            { ownerNumber: { contains: q } },
          ],
        },
        include: {
          properties: {
            include: {
              property: {
                include: {
                  ward: true,
                },
              },
            },
          },
        },
        take: 20,
      });

      results.owners = owners.map((o) => ({
        id: o.id,
        ownerNumber: o.ownerNumber,
        firstName: o.firstName,
        middleName: o.middleName,
        lastName: o.lastName,
        firstNameMr: o.firstNameMr,
        middleNameMr: o.middleNameMr,
        lastNameMr: o.lastNameMr,
        fullName: `${o.firstName} ${o.middleName || ''} ${o.lastName}`.replace(/\s+/g, ' ').trim(),
        fullNameMr: `${o.firstNameMr} ${o.middleNameMr || ''} ${o.lastNameMr || ''}`.replace(/\s+/g, ' ').trim(),
        mobileNumber: o.mobileNumber,
        aadhaarNumber: o.aadhaarNumber,
        isDisabled: o.isDisabled,
        disabilityType: o.disabilityType,
        disabilityPercentage: o.disabilityPercentage,
        linkedProperties: o.properties.map((po) => ({
          propertyNumber: po.property.propertyNumber,
          ownershipType: po.ownershipType,
          usageType: po.property.usageType,
          area: po.property.area,
          ward: po.property.ward
            ? {
                wardNumber: po.property.ward.wardNumber,
                wardNameMr: po.property.ward.wardNameMr,
              }
            : null,
        })),
        linkedPropertiesCount: o.properties.length,
      }));
    }

    // Search Wards
    if (category === 'all' || category === 'ward') {
      const wards = await db.wardMaster.findMany({
        where: {
          OR: [
            { wardNumber: { contains: q } },
            { wardName: { contains: q } },
            { wardNameMr: { contains: q } },
            { description: { contains: q } },
          ],
        },
        include: {
          properties: {
            select: {
              id: true,
              propertyNumber: true,
              usageType: true,
              area: true,
              propertyStatus: true,
            },
          },
        },
        take: 20,
      });

      results.wards = wards.map((w) => ({
        id: w.id,
        wardNumber: w.wardNumber,
        wardName: w.wardName,
        wardNameMr: w.wardNameMr,
        population: w.population,
        area: w.area,
        description: w.description,
        propertiesCount: w.properties.length,
        properties: w.properties.slice(0, 10).map((p) => ({
          propertyNumber: p.propertyNumber,
          usageType: p.usageType,
          area: p.area,
          propertyStatus: p.propertyStatus,
        })),
      }));
    }

    results.totalResults =
      results.properties.length + results.owners.length + results.wards.length;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'शोध विफल झाला', properties: [], owners: [], wards: [], totalResults: 0 },
      { status: 500 }
    );
  }
}
