import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // For Neon PostgreSQL on Vercel:
  // - POSTGRES_PRISMA_URL is the pooled connection (set by Neon integration)
  // - DATABASE_URL is set by Neon integration (pooled)
  // - DATABASE_URL_UNPOOLED is the direct connection (for Prisma CLI / migrations)
  const databaseUrl =
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
