import { Hono } from 'hono'
import { validator as zValidator, describeRoute, resolver } from 'hono-openapi'
import { verifySchema, verifyResponseSchema } from '../validators/verify.schema.js'
import * as verifyService from '../services/verify.service.js'
import { rateLimiter } from '../middleware/rate-limit.js'

const app = new Hono()

// Rate limit: 20 requests per minute per IP
app.use('*', rateLimiter({ max: 20, windowMs: 60 * 1000 }))

// ── POST / — Verify Serial Number (PUBLIC) ──
app.post(
  '/',
  describeRoute({
    description: 'Verify product authenticity by serial number. Public endpoint — no authentication required.',
    responses: {
      200: {
        description: 'Verification result',
        content: {
          'application/json': { schema: resolver(verifyResponseSchema) }
        }
      },
      400: { description: 'Validation error' },
      429: { description: 'Rate limit exceeded' }
    }
  }),
  zValidator('json', verifySchema),
  async (c) => {
    const body = c.req.valid('json')

    const userAgent = c.req.header('user-agent') || null
    const ipAddress =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      null

    const result = await verifyService.verifySerialNumber({
      ...body,
      user_agent: userAgent ?? undefined,
      ip_address: ipAddress ?? undefined
    })

    return c.json(result, 200)
  }
)

export default app
