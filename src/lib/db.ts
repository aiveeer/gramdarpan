import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
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
