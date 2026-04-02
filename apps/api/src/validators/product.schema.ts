import { z } from 'zod'
import 'zod-openapi/extend'

// ── Input Schemas ──

export const createProductSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name must not exceed 255 characters'),
  category: z.string().min(1, 'Category is required').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  photo_url: z.url('Photo URL must be a valid URL')
}).openapi({
  ref: 'CreateProductInput',
  description: 'Input payload for creating a new product'
})

export const updateProductSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  category: z.string().min(1).max(255).optional(),
  description: z.string().min(10).optional(),
  photo_url: z.string().url().optional()
}).openapi({
  ref: 'UpdateProductInput',
  description: 'Input payload for updating a product (partial)'
})

export const productParamsSchema = z.object({
  id: z.uuid('Invalid product ID format')
}).openapi({ ref: 'ProductParams' })

export const listProductsQuerySchema = z.object({
  is_active: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  page_size: z.string().optional()
}).openapi({ ref: 'ListProductsQuery' })

// ── Response Schemas ──

const productObject = z.object({
  id: z.uuid(),
  admin_id: z.uuid(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  photo_url: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  batch_count: z.number().optional(),
  qr_code_count: z.number().optional()
})

export const productResponseSchema = z.object({
  data: productObject
}).openapi({ ref: 'ProductResponse' })

export const productListResponseSchema = z.object({
  data: z.array(productObject),
  total: z.number(),
  page: z.number(),
  page_size: z.number()
}).openapi({ ref: 'ProductListResponse' })

export const archiveResponseSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    is_active: z.boolean()
  })
}).openapi({ ref: 'ArchiveResponse' })

export const deleteProductResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
}).openapi({ ref: 'DeleteProductResponse' })

// ── Types ──

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.input<typeof updateProductSchema>
