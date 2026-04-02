import { Hono } from 'hono'
import { validator as zValidator, describeRoute, resolver } from 'hono-openapi'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { 
  loginSchema, 
  loginResponseSchema, 
  refreshResponseSchema, 
  meResponseSchema 
} from '../validators/auth.schema.js'
import * as authService from '../services/auth.service.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

const REFRESH_TOKEN_COOKIE_NAME = 'proofly_refresh_token'

app.post(
  '/login',
  describeRoute({
    description: 'Login for admin to get access and refresh tokens',
    responses: {
      200: {
        description: 'Successful login',
        content: {
          'application/json': { schema: resolver(loginResponseSchema) }
        }
      },
      400: { description: 'Bad request (validation error)' },
      401: { description: 'Unauthorized (invalid credentials)' }
    }
  }),
  zValidator('json', loginSchema),
  async (c) => {
    const body = c.req.valid('json')
    const secret = process.env.JWT_SECRET!

    const { accessToken, refreshToken, expiresAt, admin } = await authService.login(body, secret)

    setCookie(c, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires: expiresAt,
      path: '/api/auth' // Only send on auth routes
    })

    return c.json({
      data: {
        access_token: accessToken,
        admin
      }
    }, 200)
  }
)

app.post(
  '/refresh',
  describeRoute({
    description: 'Refresh the access token using the HttpOnly refresh token cookie',
    responses: {
      200: {
        description: 'Successfully refreshed token',
        content: {
          'application/json': { schema: resolver(refreshResponseSchema) }
        }
      },
      401: { description: 'Unauthorized (refresh token missing or invalid)' }
    }
  }),
  async (c) => {
    const oldRefreshToken = getCookie(c, REFRESH_TOKEN_COOKIE_NAME)
    if (!oldRefreshToken) {
      return c.json({ error: 'Refresh token not found', status: 401 }, 401)
    }

    const secret = process.env.JWT_SECRET!

    const { accessToken, refreshToken, expiresAt } = await authService.refresh(oldRefreshToken, secret)

    setCookie(c, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires: expiresAt,
      path: '/api/auth'
    })

    return c.json({
      data: {
        access_token: accessToken
      }
    }, 200)
  }
)

app.post(
  '/logout',
  describeRoute({
    description: 'Logout admin and invalidate refresh token',
    responses: {
      204: { description: 'Successfully logged out' }
    }
  }),
  async (c) => {
    const refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE_NAME)
    if (refreshToken) {
      await authService.logout(refreshToken)
    }

    deleteCookie(c, REFRESH_TOKEN_COOKIE_NAME, {
      path: '/api/auth'
    })

    return c.body(null, 204)
  }
)

app.get(
  '/me',
  describeRoute({
    description: 'Get current logged in admin context',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Successful retrieval of admin data',
        content: {
          'application/json': { schema: resolver(meResponseSchema) }
        }
      },
      401: { description: 'Unauthorized (invalid or missing JWT access token)' }
    }
  }),
  authMiddleware,
  async (c) => {
    const adminId = c.var.adminId
    const adminEmail = c.var.adminEmail

    return c.json({
      data: {
        id: adminId,
        email: adminEmail
      }
    }, 200)
  }
)

export default app
