import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { openAPIRouteHandler } from 'hono-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import { errorHandler } from './middleware/error-handler.js'
import authRoutes from './routes/auth.js'

const app = new Hono()

// Global middlewares
app.use('*', logger())
app.use('*', cors())

// Register global error handler
app.onError(errorHandler)

app.route('/api/auth', authRoutes)

// Basic healthcheck route
app.get('/', (c) => {
  return c.json({ message: 'Proofly API is running 🟢' })
})

// OpenAPI Setup
app.get(
  '/openapi.json',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Proofly API',
        version: '1.0.0',
        description: 'OpenAPI Documentation for Proofly backend',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })
)

// Scalar UI Setup
app.get(
  '/docs',
  Scalar({
    theme: 'saturn',
    url: '/openapi.json',
  })
)

export default app
