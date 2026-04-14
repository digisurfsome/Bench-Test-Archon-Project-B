import { execSync } from 'child_process'
import path from 'path'

export async function setupTestDb() {
  // DATABASE_URL and JWT_SECRET are set via vitest.config.ts env
  try {
    execSync('npx prisma db push --force-reset --skip-generate', {
      env: { ...process.env },
      stdio: 'pipe',
      cwd: path.join(process.cwd(), '..'),
    })
  } catch (err) {
    console.error('Failed to setup test DB:', err)
    throw err
  }
}

export async function teardownTestDb() {
  // Import prisma lazily to avoid circular dependencies
  const { prisma } = await import('../lib/prisma')
  await prisma.$disconnect()
}
