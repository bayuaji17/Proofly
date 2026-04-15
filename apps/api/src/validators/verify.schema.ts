import { z } from 'zod'
import 'zod-openapi/extend'

// ── Input Schema ──

export const verifySchema = z.object({
  serial_number: z.string().min(1, 'Serial number is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).optional()
}).openapi({
  ref: 'VerifyInput',
  description: 'Input payload for product verification'
})

// ── Response Schemas ──

const productInfoSchema = z.object({
  name: z.string(),
  category: z.string(),
  photo_url: z.string().nullable()
})

const batchInfoSchema = z.object({
  batch_number: z.string(),
  production_date: z.string(),
  expiry_date: z.string()
})

const previousScanSchema = z.object({
  scanned_at: z.string(),
  ip_address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable()
})

export const verifyResponseSchema = z.object({
  status: z.enum(['genuine', 'counterfeit', 'not_found']),
  scan_number: z.number().optional(),
  max_scan: z.number().optional(),
  message: z.string().optional(),
  product: productInfoSchema.optional(),
  batch: batchInfoSchema.optional(),
  previous_scans: z.array(previousScanSchema).optional()
}).openapi({ ref: 'VerifyResponse' })

// ── Types ──

export type VerifyInput = z.infer<typeof verifySchema>
