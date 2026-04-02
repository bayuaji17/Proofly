import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { sign } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'
import * as adminQueries from '../db/queries/admin.js'
import * as sessionQueries from '../db/queries/sessions.js'
import type { LoginInput } from '../validators/auth.schema.js'

export async function login(input: LoginInput, jwtSecret: string) {
  const admin = await adminQueries.findByEmail(input.email)
  
  if (!admin) {
    throw new HTTPException(401, { message: 'Invalid email or password' })
  }

  const isValidPassword = await bcrypt.compare(input.password, admin.password_hash)
  if (!isValidPassword) {
    throw new HTTPException(401, { message: 'Invalid email or password' })
  }

  // Cleanup: remove expired sessions on every login
  await sessionQueries.deleteExpiredSessions()

  // Generate Access Token (15 minutes)
  const accessTokenPayload = {
    sub: admin.id,
    email: admin.email,
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
  }
  const accessToken = await sign(accessTokenPayload, jwtSecret, "HS256")

  // Generate Refresh Token (7 days)
  const refreshToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Save session to DB
  await sessionQueries.createSession(admin.id, refreshToken, expiresAt)

  // Enforce max sessions per admin (keep only 5 most recent)
  await sessionQueries.enforceSessionLimit(admin.id)

  return {
    accessToken,
    refreshToken,
    expiresAt,
    admin: {
      id: admin.id,
      email: admin.email
    }
  }
}

export async function refresh(oldRefreshToken: string, jwtSecret: string) {
  const session = await sessionQueries.findByToken(oldRefreshToken)
  if (!session) {
    throw new HTTPException(401, { message: 'Session expired or invalid. Please login again.' })
  }

  if (new Date() > session.expires_at) {
    await sessionQueries.deleteSession(oldRefreshToken)
    throw new HTTPException(401, { message: 'Session expired. Please login again.' })
  }

  const admin = await adminQueries.findById(session.admin_id)
  if (!admin) {
    throw new HTTPException(401, { message: 'Invalid user' })
  }

  // Generate Access Token (15 minutes)
  const accessTokenPayload = {
    sub: admin.id,
    email: admin.email,
    exp: Math.floor(Date.now() / 1000) + (15 * 60)
  }
  const accessToken = await sign(accessTokenPayload, jwtSecret, "HS256")

  // Generate new Refresh Token (7 days)
  const newRefreshToken = crypto.randomBytes(32).toString('hex')
  const newExpiresAt = new Date()
  newExpiresAt.setDate(newExpiresAt.getDate() + 7)

  // Atomic rotation: delete old + create new in a single transaction
  await sessionQueries.rotateSession(
    oldRefreshToken,
    admin.id,
    newRefreshToken,
    newExpiresAt
  )

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresAt: newExpiresAt
  }
}

export async function logout(refreshToken: string) {
  if (refreshToken) {
    await sessionQueries.deleteSession(refreshToken)
  }
}
