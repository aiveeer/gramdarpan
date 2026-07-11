import { NextRequest, NextResponse } from 'next/server';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function POST(request: NextRequest) {
  const results: Record<string, unknown> = {};

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
        },
      },
    });

    // 1. Check existing users
    const userCount = await prisma.user.count();
    results.existingUsers = userCount;

    // 2. Create default users if none exist
    if (userCount === 0) {
      await prisma.user.createMany({
        data: [
          {
            username: 'gpo',
            password: simpleHash('gpo123'),
            name: 'Gram Panchayat Officer',
            nameMarathi: 'ग्रामपंचायत अधिकारी',
            role: 'gpo',
          },
          {
            username: 'operator',
            password: simpleHash('op123'),
            name: 'Operator',
            nameMarathi: 'ऑपरेटर',
            role: 'operator',
          },
        ],
      });
      results.usersCreated = 'gpo/gpo123, operator/op123';
    } else {
      results.usersCreated = 'Skipped (users already exist)';
    }

    // 3. Create default financial years if none exist
    const fyCount = await prisma.financialYear.count();
    if (fyCount === 0) {
      await prisma.financialYear.createMany({
        data: [
          { yearLabel: '2023-24', startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31'), isActive: true, isCurrent: false },
          { yearLabel: '2024-25', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isActive: true, isCurrent: true },
          { yearLabel: '2025-26', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), isActive: false, isCurrent: false },
        ],
      });
      results.financialYearsCreated = '2023-24, 2024-25, 2025-26';
    }

    // 4. Create default floor info if none exist
    const floorCount = await prisma.floorInfo.count();
    if (floorCount === 0) {
      await prisma.floorInfo.createMany({
        data: [
          { floorNo: 0, floorName: 'Ground Floor', floorNameMr: 'तळ मजला', factor: 1.0 },
          { floorNo: 1, floorName: 'First Floor', floorNameMr: 'पहिला मजला', factor: 1.2 },
          { floorNo: 2, floorName: 'Second Floor', floorNameMr: 'दुसरा मजला', factor: 1.4 },
          { floorNo: 3, floorName: 'Third Floor', floorNameMr: 'तिसरा मजला', factor: 1.6 },
        ],
      });
      results.floorInfoCreated = '4 floors';
    }

    // 5. Create default tax masters if none exist
    const taxCount = await prisma.taxMaster.count();
    if (taxCount === 0) {
      await prisma.taxMaster.createMany({
        data: [
          { taxName: 'Property Tax', taxNameMr: 'मालमत्ता कर', taxType: 'property', taxRate: 12.5 },
          { taxName: 'Water Tax', taxNameMr: 'पाणी कर', taxType: 'water', taxRate: 5.0 },
          { taxName: 'Light Tax', taxNameMr: 'दिवा कर', taxType: 'light', taxRate: 3.0 },
          { taxName: 'Profession Tax', taxNameMr: 'व्यवसाय कर', taxType: 'profession', taxRate: 2.5 },
          { taxName: 'Miscellaneous Tax', taxNameMr: 'इतर कर', taxType: 'misc', taxRate: 1.0 },
        ],
      });
      results.taxMastersCreated = '5 taxes';
    }

    // Final counts
    results.finalCounts = {
      users: await prisma.user.count(),
      financialYears: await prisma.financialYear.count(),
      floorInfo: await prisma.floorInfo.count(),
      taxMasters: await prisma.taxMaster.count(),
    };

    results.status = 'SUCCESS ✅';
    await prisma.$disconnect();
  } catch (error) {
    results.status = 'FAILED ❌';
    results.error = error instanceof Error ? error.message : String(error);
    results.hint = 'Make sure POSTGRES_PRISMA_URL and POSTGRES_URL_NON_POOLING are set in Vercel Environment Variables';
  }

  return NextResponse.json(results, { status: 200 });
}
