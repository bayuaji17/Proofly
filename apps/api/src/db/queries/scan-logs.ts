import { pool } from '../connection.js'
import type { ScanLog } from '../../types/database.js'

export async function create(data: {
  qr_code_id: string
  latitude?: number
  longitude?: number
  user_agent?: string
  ip_address?: string
}): Promise<ScanLog> {
  const result = await pool.query<ScanLog>(
    `INSERT INTO scan_logs (qr_code_id, latitude, longitude, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.qr_code_id,
      data.latitude ?? null,
      data.longitude ?? null,
      data.user_agent ?? null,
      data.ip_address ?? null
    ]
  )
  return result.rows[0]
}

export async function findByQrCodeId(qrCodeId: string): Promise<ScanLog[]> {
  const result = await pool.query<ScanLog>(
    `SELECT * FROM scan_logs
     WHERE qr_code_id = $1
     ORDER BY scanned_at DESC
     LIMIT 10`,
    [qrCodeId]
  )
  return result.rows
}
