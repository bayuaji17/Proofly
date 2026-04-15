import { pool } from '../connection.js'
import type { QrCode } from '../../types/database.js'

/**
 * Bulk insert QR codes within an existing transaction client
 */
export async function bulkCreate(
  client: any,
  batchId: string,
  serialNumbers: string[]
): Promise<number> {
  if (serialNumbers.length === 0) return 0

  // Build bulk INSERT with parameterized values
  const values: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  for (const sn of serialNumbers) {
    values.push(`($${paramIndex++}, $${paramIndex++})`)
    params.push(batchId, sn)
  }

  const result = await client.query(
    `INSERT INTO qr_codes (batch_id, serial_number)
     VALUES ${values.join(', ')}
     RETURNING id`,
    params
  )

  return result.rowCount ?? 0
}

/**
 * Lock a batch within an existing transaction client
 */
export async function lockBatch(client: any, batchId: string): Promise<void> {
  await client.query(
    `UPDATE batches SET is_locked = true, updated_at = NOW() WHERE id = $1`,
    [batchId]
  )
}

/**
 * Check for serial number collisions against the database
 */
export async function findExistingSerialNumbers(serialNumbers: string[]): Promise<string[]> {
  if (serialNumbers.length === 0) return []

  const result = await pool.query<{ serial_number: string }>(
    `SELECT serial_number FROM qr_codes WHERE serial_number = ANY($1)`,
    [serialNumbers]
  )

  return result.rows.map((r) => r.serial_number)
}

/**
 * Get paginated QR codes for a batch
 */
export async function findByBatchId(
  batchId: string,
  filters: { page: number; page_size: number }
): Promise<{ rows: QrCode[]; total: number }> {
  const offset = (filters.page - 1) * filters.page_size

  const countResult = await pool.query(
    `SELECT count(*) AS total FROM qr_codes WHERE batch_id = $1`,
    [batchId]
  )
  const total = parseInt(countResult.rows[0].total, 10)

  const dataResult = await pool.query<QrCode>(
    `SELECT * FROM qr_codes
     WHERE batch_id = $1
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [batchId, filters.page_size, offset]
  )

  return { rows: dataResult.rows, total }
}

/**
 * Get all serial numbers for a batch (for PDF generation)
 */
export async function findAllByBatchId(batchId: string): Promise<QrCode[]> {
  const result = await pool.query<QrCode>(
    `SELECT * FROM qr_codes WHERE batch_id = $1 ORDER BY created_at ASC`,
    [batchId]
  )
  return result.rows
}

/**
 * Lookup QR code by serial number, JOIN product and batch info
 */
export async function findBySerialNumber(serialNumber: string) {
  const result = await pool.query(
    `SELECT q.*, b.batch_number, b.production_date, b.expiry_date, b.product_id,
       p.name AS product_name, p.category AS product_category, p.photo_url AS product_photo_url,
       p.admin_id
     FROM qr_codes q
     JOIN batches b ON q.batch_id = b.id
     JOIN products p ON b.product_id = p.id
     WHERE q.serial_number = $1`,
    [serialNumber]
  )
  return result.rows[0] ?? null
}

/**
 * Increment scan count and update status
 */
export async function incrementScanCount(
  id: string,
  newStatus: 'genuine' | 'counterfeit'
): Promise<QrCode> {
  const result = await pool.query<QrCode>(
    `UPDATE qr_codes
     SET scan_count = scan_count + 1, status = $2
     WHERE id = $1
     RETURNING *`,
    [id, newStatus]
  )
  return result.rows[0]
}
