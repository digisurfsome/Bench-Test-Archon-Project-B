import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

export async function register(data: { email: string; name: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    throw { status: 409, message: 'Email already in use' }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
    },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true }
  })

  const token = generateToken(user.id)
  return { user, token }
}

export async function login(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } })
  if (!user) {
    throw { status: 401, message: 'Invalid credentials' }
  }

  const valid = await bcrypt.compare(data.password, user.password)
  if (!valid) {
    throw { status: 401, message: 'Invalid credentials' }
  }

  const { password: _, ...userWithoutPassword } = user
  const token = generateToken(user.id)
  return { user: userWithoutPassword, token }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true }
  })
  if (!user) throw { status: 404, message: 'User not found' }
  return user
}
