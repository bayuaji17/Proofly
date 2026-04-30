import { api } from '#/lib/api'

export interface VerifyResult {
  status: 'genuine' | 'counterfeit' | 'not_found'
  scan_number?: number
  max_scan?: number
  message?: string
  product?: {
    name: string
    category: string
    photo_url: string | null
  }
  batch?: {
    batch_number: string
    production_date: string
    expiry_date: string
  }
  previous_scans?: Array<{
    scanned_at: string
    ip_address: string | null
    city: string | null
    country: string | null
  }>
}

export async function verifySerialNumber(data: {
  serial_number: string
  latitude: number
  longitude: number
}): Promise<VerifyResult> {
  return api.post<VerifyResult>('/api/verify', data, { skipAuth: true })
}
