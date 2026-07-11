import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Neon PostgreSQL variables (auto-set by Vercel-Neon Integration):
  // - POSTGRES_PRISMA_URL = pooled + connect_timeout=15 (best for Prisma Client in serverless)
  // - POSTGRES_URL_NON_POOLING = direct (best for Prisma CLI / migrations)
  // - DATABASE_URL = alternative fallback
  const databaseUrl =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_POOLED ||
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
