import { z } from 'zod'
import 'zod-openapi/extend'

// ── Input Schemas ──

export const generateQrSchema = z.object({
  label_design: z.enum(['plain']).default('plain')
}).openapi({
  ref: 'GenerateQrInput',
  description: 'Options for QR code generation'
})

export const listQrCodesQuerySchema = z.object({
  page: z.string().optional(),
  page_size: z.string().optional()
}).openapi({ ref: 'ListQrCodesQuery' })

// ── Response Schemas ──

const qrCodeObject = z.object({
  id: z.string(),
  batch_id: z.string(),
  serial_number: z.string(),
  status: z.enum(['unscanned', 'genuine', 'counterfeit']),
  scan_count: z.number(),
  created_at: z.string()
})

export const generateQrResponseSchema = z.object({
  data: z.object({
    batch_id: z.string(),
    total_generated: z.number(),
    serial_numbers: z.array(z.string())
  })
}).openapi({ ref: 'GenerateQrResponse' })

export const qrCodeListResponseSchema = z.object({
  data: z.array(qrCodeObject),
  total: z.number(),
  page: z.number(),
  page_size: z.number()
}).openapi({ ref: 'QrCodeListResponse' })
