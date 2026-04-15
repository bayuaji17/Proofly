import { pool } from '../connection.js'
import type { Batch, BatchWithCounts } from '../../types/database.js'

export async function create(productId: string, data: {
  batch_number: string
  quantity: number
  production_date: string
  expiry_date: string
}): Promise<Batch> {
  const result = await pool.query<Batch>(
    `INSERT INTO batches (product_id, batch_number, quantity, production_date, expiry_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [productId, data.batch_number, data.quantity, data.production_date, data.expiry_date]
  )
  return result.rows[0]
}

export async function findById(id: string): Promise<BatchWithCounts | null> {
  const result = await pool.query<BatchWithCounts>(
    `SELECT b.*,
       p.name AS product_name,
       COALESCE((SELECT count(*) FROM qr_codes q WHERE q.batch_id = b.id), 0)::int AS qr_code_count,
       COALESCE((SELECT count(*) FROM scan_logs sl JOIN qr_codes q ON sl.qr_code_id = q.id WHERE q.batch_id = b.id), 0)::int AS total_scans
     FROM batches b
     JOIN products p ON b.product_id = p.id
     WHERE b.id = $1`,
    [id]
  )
  return result.rows[0] ?? null
}

export async function findByProductId(productId: string): Promise<BatchWithCounts[]> {
  const result = await pool.query<BatchWithCounts>(
    `SELECT b.*,
       COALESCE((SELECT count(*) FROM qr_codes q WHERE q.batch_id = b.id), 0)::int AS qr_code_count,
       COALESCE((SELECT count(*) FROM scan_logs sl JOIN qr_codes q ON sl.qr_code_id = q.id WHERE q.batch_id = b.id), 0)::int AS total_scans
     FROM batches b
     WHERE b.product_id = $1
     ORDER BY b.created_at DESC`,
    [productId]
  )
  return result.rows
}

export async function update(id: string, data: {
  batch_number?: string
  quantity?: number
  production_date?: string
  expiry_date?: string
}): Promise<Batch | null> {
  const setClauses: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (data.batch_number !== undefined) {
    setClauses.push(`batch_number = $${paramIndex++}`)
    params.push(data.batch_number)
  }
  if (data.quantity !== undefined) {
    setClauses.push(`quantity = $${paramIndex++}`)
    params.push(data.quantity)
  }
  if (data.production_date !== undefined) {
    setClauses.push(`production_date = $${paramIndex++}`)
    params.push(data.production_date)
  }
  if (data.expiry_date !== undefined) {
    setClauses.push(`expiry_date = $${paramIndex++}`)
    params.push(data.expiry_date)
  }

  if (setClauses.length === 0) return null

  setClauses.push(`updated_at = NOW()`)
  params.push(id)

  const result = await pool.query<Batch>(
    `UPDATE batches SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  )
  return result.rows[0] ?? null
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM batches WHERE id = $1',
    [id]
  )
  return (result.rowCount ?? 0) > 0
}

export async function isLocked(id: string): Promise<boolean> {
  const result = await pool.query<{ is_locked: boolean }>(
    'SELECT is_locked FROM batches WHERE id = $1',
    [id]
  )
  if (!result.rows[0]) return false
  return result.rows[0].is_locked
}

export async function updatePdfStatus(
  id: string,
  status: 'idle' | 'processing' | 'completed' | 'failed',
  pdfUrl?: string | null
): Promise<void> {
  if (pdfUrl !== undefined) {
    await pool.query(
      `UPDATE batches SET pdf_status = $2, pdf_url = $3, updated_at = NOW() WHERE id = $1`,
      [id, status, pdfUrl]
    )
  } else {
    await pool.query(
      `UPDATE batches SET pdf_status = $2, updated_at = NOW() WHERE id = $1`,
      [id, status]
    )
  }
}

