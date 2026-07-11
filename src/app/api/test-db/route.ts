import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check which Neon environment variables are available
  const envVars = [
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'POSTGRES_URL',
    'DATABASE_URL',
    'DATABASE_URL_POOLED',
    'DATABASE_URL_UNPOOLED',
    'PGHOST',
    'PGUSER',
    'PGDATABASE',
  ];

  results.envCheck = {};
  for (const v of envVars) {
    const val = process.env[v];
    if (val) {
      // Mask the password for security
      const masked = val.replace(/:([^@]+)@/, ':****@');
      results.envCheck[v] = masked;
    } else {
      results.envCheck[v] = 'NOT SET';
    }
  }

  // 2. Try to connect with Prisma
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
        },
      },
    });

    // Try a simple query
    const userCount = await prisma.user.count();
    results.dbConnection = 'SUCCESS ✅';
    results.userCount = userCount;

    if (userCount === 0) {
      results.warning = 'Database is empty! Need to seed default users.';
    }

    await prisma.$disconnect();
  } catch (dbError) {
    results.dbConnection = 'FAILED ❌';
    results.dbError = dbError instanceof Error ? dbError.message : String(dbError);
  }

  // 3. Try raw connection with pg
  try {
    const pg = await import('pg');
    const pool = new pg.default.Pool({
      connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL,
    });
    const client = await pool.connect();
    const res = await client.query('SELECT current_database(), current_user, version()');
    results.rawPgConnection = 'SUCCESS ✅';
    results.rawPgInfo = res.rows[0];
    client.release();
    await pool.end();
  } catch (pgError) {
    results.rawPgConnection = 'FAILED ❌';
    results.rawPgError = pgError instanceof Error ? pgError.message : String(pgError);
  }

  return NextResponse.json(results, { status: 200 });
}
