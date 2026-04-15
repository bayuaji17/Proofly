import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { openAPIRouteHandler } from 'hono-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import { errorHandler } from './middleware/error-handler.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import batchRoutes from './routes/batches.js'
import uploadRoutes from './routes/upload.js'
import verifyRoutes from './routes/verify.js'

const app = new Hono()

// Global middlewares
app.use('*', logger())
app.use('*', cors({
  origin: process.env.FRONTEND_BASEURL || 'http://localhost:3000',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// Register global error handler
app.onError(errorHandler)

app.route('/api/auth', authRoutes)
app.route('/api/products', productRoutes)
app.route('/api', batchRoutes)
app.route('/api/upload', uploadRoutes)
app.route('/api/verify', verifyRoutes)

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
