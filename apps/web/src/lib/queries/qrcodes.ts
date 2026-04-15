import { queryOptions } from '@tanstack/react-query'
import { api } from '../api'
import { authStore } from '../auth-store'

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
// Data fetch for download functionality won't use react-query because it's a direct download/Blob fetch

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

export async function downloadPdfBlob(batchId: string): Promise<Blob> {
  const url = api.buildUrl(`/api/batches/${batchId}/download`)
  
  const token = authStore.getToken()
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Use raw fetch because axios/api wrapper might not handle blob automatically
  const response = await fetch(url, {
    method: 'GET',
    headers
  })
  
  if (!response.ok) {
    throw new Error('Gagal mengunduh PDF atau batch belum terkunci')
  }
  
  return response.blob()
}
