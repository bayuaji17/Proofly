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
  photo_url: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface ProductWithCounts extends Product {
  batch_count: number
  qr_code_count: number
}

export interface Batch {
  id: string
  product_id: string
  batch_number: string
  quantity: number
  production_date: string
  expiry_date: string
  is_locked: boolean
  created_at: Date
  updated_at: Date
}

export interface BatchWithCounts extends Batch {
  qr_code_count: number
  total_scans: number
  product_name?: string
}

export interface QrCode {
  id: string
  batch_id: string
  serial_number: string
  status: 'unscanned' | 'genuine' | 'counterfeit'
  scan_count: number
  created_at: Date
}

export interface ScanLog {
  id: string
  qr_code_id: string
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
  user_agent: string | null
  ip_address: string | null
  scanned_at: Date
}

export interface NotificationRecord {
  id: string
  admin_id: string
  type: string
  title: string
  message: string
  reference_id: string | null
  is_read: boolean
  created_at: Date
}
