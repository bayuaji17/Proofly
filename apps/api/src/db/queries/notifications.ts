import { pool } from '../connection.js'
import type { NotificationRecord } from '../../types/database.js'

export async function create(data: {
  admin_id: string
  type: string
  title: string
  message: string
  reference_id?: string
}): Promise<NotificationRecord> {
  const result = await pool.query<NotificationRecord>(
    `INSERT INTO notifications (admin_id, type, title, message, reference_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.admin_id, data.type, data.title, data.message, data.reference_id ?? null]
  )
  return result.rows[0]
}
