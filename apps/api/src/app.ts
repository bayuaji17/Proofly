import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { errorHandler } from './middleware/error-handler.js'

const app = new Hono()

// Global middlewares
app.use('*', logger())
app.use('*', cors())

// Register global error handler
app.onError(errorHandler)

// Basic healthcheck route
app.get('/', (c) => {
  return c.json({ message: 'Proofly API is running 🟢' })
})

export default app
