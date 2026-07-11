import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Vercel-Neon Integration auto-sets these:
  // - DATABASE_URL (unpooled/direct connection)
  // - DATABASE_URL_POOLED (pooled via pgbouncer — best for serverless)
  // For local dev: DATABASE_URL points to SQLite
  const databaseUrl =
    process.env.DATABASE_URL_POOLED ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    ''

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

// In development, always create new client to pick up schema changes
// In production, reuse the singleton for performance
const isDev = process.env.NODE_ENV === 'development'

if (isDev && globalForPrisma.prisma) {
  globalForPrisma.prisma.$disconnect().catch(() => {})
}

if (!globalForPrisma.prisma || isDev) {
  globalForPrisma.prisma = createPrismaClient()
}

export const db = globalForPrisma.prisma
