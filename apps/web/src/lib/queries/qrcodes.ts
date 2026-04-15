import { queryOptions } from '@tanstack/react-query'
import { api } from '../api'

export interface QrCode {
  id: string
  batch_id: string
  serial_number: string
  status: 'unscanned' | 'genuine' | 'counterfeit'
  scan_count: number
  created_at: string
}

export interface QrCodesListResponse {
  data: QrCode[]
  total: number
  page: number
  page_size: number
}

// ── QUERIES ──

export const qrCodesQueryOptions = (
  batchId: string,
  page: number = 1,
  pageSize: number = 20,
) =>
  queryOptions({
    queryKey: ['batches', batchId, 'qrcodes', page, pageSize],
    queryFn: async () => {
      // Return empty if batchId is missing (e.g. invalid state)
      if (!batchId) return { data: [], total: 0, page, page_size: pageSize }
      const searchParams = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })
      return api.get<QrCodesListResponse>(`/api/batches/${batchId}/qrcodes?${searchParams.toString()}`)
    },
  })

// ── MUTATIONS ──

export async function generateQrCodes(
  batchId: string,
  labelDesign: 'plain' = 'plain',
) {
  return api.post<{
    data: {
      batch_id: string
      total_generated: number
      serial_numbers: string[]
    }
  }>(`/api/batches/${batchId}/generate`, { label_design: labelDesign })
}

export async function retryPdfGeneration(batchId: string) {
  return api.post<{ message: string; batch_id: string }>(
    `/api/batches/${batchId}/retry-pdf`
  )
}
