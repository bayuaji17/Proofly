/* ------------------------------------------------------------------ */
/*  Domain Models                                                      */
/* ------------------------------------------------------------------ */

export interface Product {
  id: string
  admin_id: string
  name: string
  category: string
  description: string
  photo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  batch_count?: number
  qr_code_count?: number
}

export interface Batch {
  id: string
  product_id: string
  batch_number: string
  quantity: number
  production_date: string
  expiry_date: string
  is_locked: boolean
  pdf_url: string | null
  pdf_status: 'idle' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  qr_code_count?: number
  total_scans?: number
  product_name?: string
}

/* ------------------------------------------------------------------ */
/*  API Response Types                                                 */
/* ------------------------------------------------------------------ */

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}

export interface PresignResponse {
  data: {
    upload_url: string
    public_url: string
    key: string
  }
}
