import type { Context, Next } from 'hono'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const ipMap = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of ipMap) {
    if (now > entry.resetAt) {
      ipMap.delete(ip)
    }
  }
}, 5 * 60 * 1000).unref()

/**
 * Rate limiter middleware (in-memory, per IP)
 */
export function rateLimiter(options: { max: number; windowMs: number }) {
  return async (c: Context, next: Next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown'

    const now = Date.now()
    const entry = ipMap.get(ip)

    if (!entry || now > entry.resetAt) {
      // New window
      ipMap.set(ip, { count: 1, resetAt: now + options.windowMs })
      await next()
      return
    }

    if (entry.count >= options.max) {
      return c.json(
        { error: 'Too many requests. Please try again later.' },
        429
      )
    }

    entry.count++
    await next()
  }
}
