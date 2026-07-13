import { NextResponse } from 'next/server';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function setupDatabase() {
  const results: Record<string, unknown> = {};

  // Check which env vars are available
  const envVars = ['DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING', 'DATABASE_URL_POOLED', 'DATABASE_URL_UNPOOLED'];
  results.envCheck = {};
  for (const v of envVars) {
    const val = process.env[v];
    results.envCheck[v] = val ? val.replace(/:([^@]+)@/, ':****@') : 'NOT SET';
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED || '';
    results.usingUrl = dbUrl ? dbUrl.replace(/:([^@]+)@/, ':****@') : 'NONE';

    const prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: { db: { url: dbUrl } },
    });

    // 1. Check/create default users
    const userCount = await prisma.user.count();
    results.existingUsers = userCount;
    if (userCount === 0) {
      await prisma.user.createMany({
        data: [
          { username: 'gpo', password: simpleHash('gpo123'), name: 'Gram Panchayat Officer', nameMarathi: 'ग्रामपंचायत अधिकारी', role: 'gpo' },
          { username: 'operator', password: simpleHash('op123'), name: 'Operator', nameMarathi: 'ऑपरेटर', role: 'operator' },
        ],
      });
      results.usersCreated = '✅ gpo/gpo123, operator/op123';
    } else {
      results.usersCreated = '⏭️ Already exist';
    }

    // 2. Financial years
    const fyCount = await prisma.financialYear.count();
    if (fyCount === 0) {
      await prisma.financialYear.createMany({
        data: [
          { yearLabel: '2023-24', startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31'), isActive: true, isCurrent: false },
          { yearLabel: '2024-25', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isActive: true, isCurrent: true },
        ],
      });
      results.financialYears = '✅ Created';
    } else {
      results.financialYears = '⏭️ Already exist';
    }

    // 3. Tax masters
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
      results.taxMasters = '✅ Created';
    } else {
      results.taxMasters = '⏭️ Already exist';
    }

    results.status = 'SUCCESS ✅';
    results.message = 'Database is ready! You can now login with gpo/gpo123';
    results.finalCounts = {
      users: await prisma.user.count(),
      financialYears: await prisma.financialYear.count(),
      taxMasters: await prisma.taxMaster.count(),
    };

    await prisma.$disconnect();
  } catch (error) {
    results.status = 'FAILED ❌';
    results.error = error instanceof Error ? error.message : String(error);
    results.hint = 'Check if DATABASE_URL is set in Vercel Environment Variables';
  }

  return results;
}

// GET: Visit in browser to setup database
export async function GET() {
  const results = await setupDatabase();
  return NextResponse.json(results, { status: 200 });
}

// POST: Call via API to setup database
export async function POST() {
  const results = await setupDatabase();
  return NextResponse.json(results, { status: 200 });
}
