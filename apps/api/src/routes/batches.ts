import { Hono } from 'hono'
import { validator as zValidator, describeRoute, resolver } from 'hono-openapi'
import {
  createBatchSchema,
  updateBatchSchema,
  batchResponseSchema,
  batchListResponseSchema,
  deleteBatchResponseSchema
} from '../validators/batch.schema.js'
import {
  generateQrSchema,
  listQrCodesQuerySchema,
  generateQrResponseSchema,
  qrCodeListResponseSchema
} from '../validators/qrcode.schema.js'
import * as batchService from '../services/batch.service.js'
import * as qrcodeService from '../services/qrcode.service.js'
import * as pdfService from '../services/pdf.service.js'
import { authMiddleware } from '../middleware/auth.js'

type AuthEnv = {
  Variables: {
    adminId: string
    adminEmail: string
  }
}

const app = new Hono<AuthEnv>()

// Only apply auth to the batch routes, not everything under /api
app.use('/products/*/batches/*', authMiddleware)
app.use('/products/*/batches', authMiddleware)
app.use('/batches/*', authMiddleware)

// ── POST /products/:productId/batches — Create Batch ──
app.post(
  '/products/:productId/batches',
  describeRoute({
    description: 'Create a new batch for a product',
    security: [{ BearerAuth: [] }],
    responses: {
      201: {
        description: 'Batch created successfully',
        content: {
          'application/json': { schema: resolver(batchResponseSchema) }
        }
      },
      400: { description: 'Validation error' },
      401: { description: 'Unauthorized' },
      404: { description: 'Product not found' },
      409: { description: 'Duplicate batch number for this product' }
    }
  }),
  zValidator('json', createBatchSchema),
  async (c) => {
    const productId = c.req.param('productId')
    const body = c.req.valid('json')
    const batch = await batchService.createBatch(productId, body)
    return c.json({ data: batch }, 201)
  }
)

// ── GET /products/:productId/batches — List Batches ──
app.get(
  '/products/:productId/batches',
  describeRoute({
    description: 'List all batches for a product',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'List of batches for the product',
        content: {
          'application/json': { schema: resolver(batchListResponseSchema) }
        }
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Product not found' }
    }
  }),
  async (c) => {
    const productId = c.req.param('productId')
    const batches = await batchService.listBatches(productId)
    return c.json({ data: batches }, 200)
  }
)

// ── GET /batches/:id — Get Batch Detail ──
app.get(
  '/batches/:id',
  describeRoute({
    description: 'Get batch detail by ID',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Batch detail with QR code count and scan totals',
        content: {
          'application/json': { schema: resolver(batchResponseSchema) }
        }
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Batch not found' }
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const batch = await batchService.getBatch(id)
    return c.json({ data: batch }, 200)
  }
)

// ── PUT /batches/:id — Update Batch ──
app.put(
  '/batches/:id',
  describeRoute({
    description: 'Update a batch. Locked batches cannot be updated.',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Batch updated successfully',
        content: {
          'application/json': { schema: resolver(batchResponseSchema) }
        }
      },
      400: { description: 'Validation error' },
      401: { description: 'Unauthorized' },
      404: { description: 'Batch not found' },
      409: { description: 'Conflict — batch is locked' }
    }
  }),
  zValidator('json', updateBatchSchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const batch = await batchService.updateBatch(id, body)
    return c.json({ data: batch }, 200)
  }
)

// ── DELETE /batches/:id — Delete Batch ──
app.delete(
  '/batches/:id',
  describeRoute({
    description: 'Delete a batch. Locked batches cannot be deleted.',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Batch deleted successfully',
        content: {
          'application/json': { schema: resolver(deleteBatchResponseSchema) }
        }
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Batch not found' },
      409: { description: 'Conflict — batch is locked' }
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    await batchService.deleteBatch(id)
    return c.json({
      success: true,
      message: 'Batch deleted successfully'
    }, 200)
  }
)

// ── POST /batches/:batchId/generate — Generate QR Codes ──
app.post(
  '/batches/:batchId/generate',
  describeRoute({
    description: 'Generate QR codes for a batch. Locks the batch afterwards.',
    security: [{ BearerAuth: [] }],
    responses: {
      201: {
        description: 'QR codes generated successfully',
        content: {
          'application/json': { schema: resolver(generateQrResponseSchema) }
        }
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Batch not found' },
      409: { description: 'Batch already locked (QR codes already generated)' }
    }
  }),
  async (c) => {
    const batchId = c.req.param('batchId')
    const result = await qrcodeService.generateForBatch(batchId)
    return c.json({ data: result }, 201)
  }
)

// ── GET /batches/:batchId/qrcodes — List QR Codes ──
app.get(
  '/batches/:batchId/qrcodes',
  describeRoute({
    description: 'List QR codes for a batch with pagination',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Paginated list of QR codes',
        content: {
          'application/json': { schema: resolver(qrCodeListResponseSchema) }
        }
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Batch not found' }
    }
  }),
  zValidator('query', listQrCodesQuerySchema),
  async (c) => {
    const batchId = c.req.param('batchId')
    const query = c.req.valid('query')
    const page = parseInt(query.page || '1', 10)
    const page_size = parseInt(query.page_size || '20', 10)

    const { rows, total } = await qrcodeService.listQrCodes(batchId, { page, page_size })
    return c.json({ data: rows, total, page, page_size }, 200)
  }
)

// ── GET /batches/:batchId/download — Download PDF ──
app.get(
  '/batches/:batchId/download',
  describeRoute({
    description: 'Download QR codes as a printable PDF (A4 grid layout)',
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: 'PDF file containing QR codes' },
      400: { description: 'QR codes not yet generated' },
      401: { description: 'Unauthorized' },
      404: { description: 'Batch not found' }
    }
  }),
  async (c) => {
    const batchId = c.req.param('batchId')
    const pdfBuffer = await pdfService.generatePdf(batchId)

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="qrcodes-${batchId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  }
)

export default app
