export interface Admin {
  id: string
  email: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

export interface AdminSession {
  id: string
  admin_id: string
  refresh_token: string
  expires_at: Date
  created_at: Date
}

export interface Product {
  id: string
  admin_id: string
  name: string
  category: string
  description: string
  photo_url: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface ProductWithCounts extends Product {
  batch_count: number
  qr_code_count: number
}
