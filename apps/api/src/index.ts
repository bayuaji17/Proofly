import { serve } from '@hono/node-server'
import app from './app.js'
import { testConnection } from './db/connection.js'
import { startPdfWorker } from './workers/pdf-worker.js'

// Test DB Connection on startup
await testConnection()

const port = Number(process.env.PORT) || 3001
console.log(`🔥 Proofly API running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })

// Start background workers
startPdfWorker()

