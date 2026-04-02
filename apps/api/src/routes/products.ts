import { Hono } from 'hono'
import { validator as zValidator, describeRoute, resolver } from 'hono-openapi'
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  productResponseSchema,
  productListResponseSchema,
  archiveResponseSchema,
  deleteProductResponseSchema
} from '../validators/product.schema.js'
import * as productService from '../services/product.service.js'
import { authMiddleware } from '../middleware/auth.js'

type AuthEnv = {
  Variables: {
    adminId: string
    adminEmail: string
  }
}

const app = new Hono<AuthEnv>()

// All product routes require authentication
app.use('*', authMiddleware)

// ── POST / — Create Product ──
app.post(
  '/',
  describeRoute({
    description: 'Create a new product',
    security: [{ BearerAuth: [] }],
    responses: {
      201: {
        description: 'Product created successfully',
        content: {
          'application/json': { schema: resolver(productResponseSchema) }
        }
      },
      400: { description: 'Validation error' },
      401: { description: 'Unauthorized' }
    }
  }),
  zValidator('json', createProductSchema),
  async (c) => {
    const body = c.req.valid('json')
    const adminId = c.var.adminId

    const product = await productService.createProduct(adminId, body)

    return c.json({ data: product }, 201)
  }
)

// ── GET / — List Products ──
app.get(
  '/',
  describeRoute({
    description: 'List all products with pagination and search',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Paginated list of products',
        content: {
          'application/json': { schema: resolver(productListResponseSchema) }
        }
      },
      401: { description: 'Unauthorized' }
    }
  }),
  zValidator('query', listProductsQuerySchema),
  async (c) => {
    const query = c.req.valid('query')

    const page = parseInt(query.page || '1', 10)
    const page_size = parseInt(query.page_size || '20', 10)
    const is_active = query.is_active !== undefined
      ? query.is_active === 'true'
      : undefined

    const { rows, total } = await productService.listProducts({
      is_active,
      search: query.search,
      page,
      page_size
    })

    return c.json({
      data: rows,
      total,
      page,
      page_size
    }, 200)
  }
)

// ── GET /:id — Get Product Detail ──
app.get(
  '/:id',
  describeRoute({
    description: 'Get product detail by ID',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Product detail with batch and QR code counts',
        content: {
          'application/json': { schema: resolver(productResponseSchema) }
        }
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Product not found' }
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const product = await productService.getProduct(id)
    return c.json({ data: product }, 200)
  }
)

// ── PUT /:id — Update Product ──
app.put(
  '/:id',
  describeRoute({
    description: 'Update an existing product',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Product updated successfully',
        content: {
          'application/json': { schema: resolver(productResponseSchema) }
        }
      },
      400: { description: 'Validation error' },
      401: { description: 'Unauthorized' },
      404: { description: 'Product not found' }
    }
  }),
  zValidator('json', updateProductSchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const product = await productService.updateProduct(id, body)
    return c.json({ data: product }, 200)
  }
)

// ── DELETE /:id — Delete Product ──
app.delete(
  '/:id',
  describeRoute({
    description: 'Delete a product. Fails if the product has locked batches.',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Product deleted successfully',
        content: {
          'application/json': { schema: resolver(deleteProductResponseSchema) }
        }
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Product not found' },
      409: { description: 'Conflict — product has locked batches' }
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    await productService.deleteProduct(id)
    return c.json({
      success: true,
      message: 'Product deleted successfully'
    }, 200)
  }
)

// ── PATCH /:id/archive — Toggle Archive ──
app.patch(
  '/:id/archive',
  describeRoute({
    description: 'Toggle product archive status (active/inactive)',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Product archive status toggled',
        content: {
          'application/json': { schema: resolver(archiveResponseSchema) }
        }
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Product not found' }
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const result = await productService.archiveProduct(id)
    return c.json({ data: result }, 200)
  }
)

export default app
