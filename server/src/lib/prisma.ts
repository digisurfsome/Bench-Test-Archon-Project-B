import { PrismaClient } from '@prisma/client'

// Use a global variable to allow test setup to reset the connection
// after changing DATABASE_URL
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
