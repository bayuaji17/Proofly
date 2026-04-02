import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../src/app.js'
import bcrypt from 'bcrypt'
import * as adminQueries from '../src/db/queries/admin.js'
import * as sessionQueries from '../src/db/queries/sessions.js'
import { sign } from 'hono/jwt'

// Mock database query dependencies
vi.mock('../src/db/queries/admin.js', () => ({
  findByEmail: vi.fn(),
  findById: vi.fn()
}))

vi.mock('../src/db/queries/sessions.js', () => ({
  createSession: vi.fn(),
  findByToken: vi.fn(),
  deleteSession: vi.fn(),
  rotateSession: vi.fn(),
  enforceSessionLimit: vi.fn(),
  deleteExpiredSessions: vi.fn()
}))

// Mock bcrypt dependency
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn()
  }
}))

describe('Proofly API — Auth', () => {
  const dummyAdmin = {
    id: '11111111-2222-3333-4444-555555555555',
    email: 'admin@proofly.test',
    password_hash: 'hashedpassword123',
    created_at: new Date(),
    updated_at: new Date()
  }

  beforeEach(() => {
    vi.resetAllMocks()
    process.env.JWT_SECRET = 'test_secret'
  })

  describe('POST /api/auth/login', () => {
    it('Should return 200 and auth tokens on valid credentials', async () => {
      vi.mocked(adminQueries.findByEmail).mockResolvedValue(dummyAdmin)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as unknown as void)
      vi.mocked(sessionQueries.createSession).mockResolvedValue({} as any)
      vi.mocked(sessionQueries.deleteExpiredSessions).mockResolvedValue(0)
      vi.mocked(sessionQueries.enforceSessionLimit).mockResolvedValue(undefined)

      const payload = { email: 'admin@proofly.test', password: 'password123' }
      
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(res.status).toBe(200)
      
      const json = await res.json()
      expect(json.data).toHaveProperty('access_token')
      expect(json.data.admin.email).toBe(dummyAdmin.email)

      // Test HttpOnly Cookie Header `Set-Cookie`
      const headers = res.headers.get('Set-Cookie')
      expect(headers).toContain('proofly_refresh_token=')
      expect(headers).toContain('HttpOnly')

      expect(adminQueries.findByEmail).toHaveBeenCalledWith(payload.email)
      expect(bcrypt.compare).toHaveBeenCalledWith(payload.password, dummyAdmin.password_hash)
    })

    it('Should return 401 on invalid email', async () => {
      vi.mocked(adminQueries.findByEmail).mockResolvedValue(null)
      
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@test.com', password: 'xyz' })
      })

      expect(res.status).toBe(401)
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('Should return 401 on incorrect password', async () => {
      vi.mocked(adminQueries.findByEmail).mockResolvedValue(dummyAdmin)
      vi.mocked(bcrypt.compare).mockResolvedValue(false as unknown as void)
      
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dummyAdmin.email, password: 'wrong' })
      })

      expect(res.status).toBe(401)
    })

    it('Should return 400 on bad Zod schema input', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'notanemail' }) // Missing password, invalid email format
      })

      expect(res.status).toBe(400) // Zod validation failure standard from @hono/zod-validator
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('Should return 200 and a new access_token with a valid refresh_token cookie', async () => {
      const dummySession = {
        id: 'session1',
        admin_id: dummyAdmin.id,
        refresh_token: 'valid_refresh_token',
        expires_at: new Date(Date.now() + 100000), // Future date
        created_at: new Date()
      }
      vi.mocked(sessionQueries.findByToken).mockResolvedValue(dummySession)
      vi.mocked(adminQueries.findById).mockResolvedValue(dummyAdmin)
      vi.mocked(sessionQueries.rotateSession).mockResolvedValue({} as any)

      const res = await app.request('/api/auth/refresh', {
        method: 'POST',
        headers: { 
          'Cookie': 'proofly_refresh_token=valid_refresh_token'
        }
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toHaveProperty('access_token')
      
      // Cookie is rotated
      expect(res.headers.get('Set-Cookie')).toContain('proofly_refresh_token=')
      
      expect(sessionQueries.rotateSession).toHaveBeenCalled()
    })

    it('Should return 401 if refresh cookie is missing', async () => {
      const res = await app.request('/api/auth/refresh', {
        method: 'POST'
      })
      expect(res.status).toBe(401)
    })

    it('Should return 401 if token is expired in db', async () => {
      const expiredSession = {
        id: 'session2',
        admin_id: dummyAdmin.id,
        refresh_token: 'expired_refresh_token',
        expires_at: new Date(Date.now() - 100000), // Past date
        created_at: new Date()
      }
      vi.mocked(sessionQueries.findByToken).mockResolvedValue(expiredSession)
      vi.mocked(sessionQueries.deleteSession).mockResolvedValue(undefined)

      const res = await app.request('/api/auth/refresh', {
        method: 'POST',
        headers: { 
          'Cookie': 'proofly_refresh_token=expired_refresh_token'
        }
      })

      expect(res.status).toBe(401)
      expect(sessionQueries.deleteSession).toHaveBeenCalledWith('expired_refresh_token')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('Should clear cookie and return 204', async () => {
      vi.mocked(sessionQueries.deleteSession).mockResolvedValue(undefined)

      const res = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Cookie': 'proofly_refresh_token=sometoken'
        }
      })

      expect(res.status).toBe(204)
      expect(res.headers.get('Set-Cookie')).toContain('proofly_refresh_token=;') // deleted
      expect(sessionQueries.deleteSession).toHaveBeenCalledWith('sometoken')
    })
  })

  describe('GET /api/auth/me', () => {
    it('Should return 200 with a valid Access Token', async () => {
      const secret = 'test_secret'
      const activeToken = await sign({
        sub: dummyAdmin.id,
        email: dummyAdmin.email,
        exp: Math.floor(Date.now() / 1000) + 3600
      }, secret, 'HS256')

      const res = await app.request('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.id).toBe(dummyAdmin.id)
      expect(json.data.email).toBe(dummyAdmin.email)
    })

    it('Should return 401 without Authorization token', async () => {
      const res = await app.request('/api/auth/me', {
        method: 'GET'
      })

      expect(res.status).toBe(401)
    })

    it('Should return 401 if token expired', async () => {
      const secret = 'test_secret'
      const expiredToken = await sign({
        sub: dummyAdmin.id,
        email: dummyAdmin.email,
        exp: Math.floor(Date.now() / 1000) - 1 // 1 second ago
      }, secret, 'HS256')

      const res = await app.request('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      })

      expect(res.status).toBe(401)
    })
  })
})
