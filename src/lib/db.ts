import { PrismaClient } from '@prisma/client'

// Prisma client singleton - force new instance on reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always create a new client to pick up schema changes
if (globalForPrisma.prisma) {
  globalForPrisma.prisma.$disconnect().catch(() => {})
}
globalForPrisma.prisma = new PrismaClient({
  log: ['query'],
})

export const db = globalForPrisma.prisma