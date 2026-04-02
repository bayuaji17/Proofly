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
