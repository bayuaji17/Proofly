import { Hono } from 'hono'
import { validator as zValidator, describeRoute, resolver } from 'hono-openapi'
import {
  createBatchSchema,
  updateBatchSchema,
  batchResponseSchema,
  batchListResponseSchema,
  deleteBatchResponseSchema
} from '../validators/batch.schema.js'
import * as batchService from '../services/batch.service.js'
import { authMiddleware } from '../middleware/auth.js'

type AuthEnv = {
  Variables: {
    adminId: string
    adminEmail: string
  }
}

const app = new Hono<AuthEnv>()

// All batch routes require authentication
app.use('*', authMiddleware)

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

export default app
