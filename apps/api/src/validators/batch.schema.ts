import { z } from 'zod'
import 'zod-openapi/extend'

// ── Input Schemas ──

export const createBatchSchema = z.object({
  batch_number: z.string().min(1, 'Batch number is required').max(255),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100000, 'Quantity must not exceed 100000'),
  production_date: z.string().date('Invalid production date format (YYYY-MM-DD)'),
  expiry_date: z.string().date('Invalid expiry date format (YYYY-MM-DD)')
}).refine(
  (data) => new Date(data.expiry_date) > new Date(data.production_date),
  { message: 'Expiry date must be after production date', path: ['expiry_date'] }
).openapi({
  ref: 'CreateBatchInput',
  description: 'Input payload for creating a new batch'
})

export const updateBatchSchema = z.object({
  batch_number: z.string().min(1).max(255).optional(),
  quantity: z.number().int().min(1).max(100000).optional(),
  production_date: z.string().date().optional(),
  expiry_date: z.string().date().optional()
}).openapi({
  ref: 'UpdateBatchInput',
  description: 'Input payload for updating a batch (partial)'
})

// ── Response Schemas ──

const batchObject = z.object({
  id: z.string(),
  product_id: z.string(),
  batch_number: z.string(),
  quantity: z.number(),
  production_date: z.string(),
  expiry_date: z.string(),
  is_locked: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  qr_code_count: z.number().optional(),
  total_scans: z.number().optional(),
  product_name: z.string().optional()
})

export const batchResponseSchema = z.object({
  data: batchObject
}).openapi({ ref: 'BatchResponse' })

export const batchListResponseSchema = z.object({
  data: z.array(batchObject)
}).openapi({ ref: 'BatchListResponse' })

export const deleteBatchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
}).openapi({ ref: 'DeleteBatchResponse' })

// ── Types ──

export type CreateBatchInput = z.infer<typeof createBatchSchema>
