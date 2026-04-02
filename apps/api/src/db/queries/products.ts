import { pool } from '../connection.js'
import type { Product, ProductWithCounts } from '../../types/database.js'

export async function create(adminId: string, data: {
  name: string
  category: string
  description: string
  photo_url: string
}): Promise<Product> {
  const result = await pool.query<Product>(
    `INSERT INTO products (admin_id, name, category, description, photo_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [adminId, data.name, data.category, data.description, data.photo_url]
  )
  return result.rows[0]
}

export async function findById(id: string): Promise<ProductWithCounts | null> {
  const result = await pool.query<ProductWithCounts>(
    `SELECT p.*,
       COALESCE((SELECT count(*) FROM batches b WHERE b.product_id = p.id), 0)::int AS batch_count,
       COALESCE((SELECT count(*) FROM qr_codes q JOIN batches b ON q.batch_id = b.id WHERE b.product_id = p.id), 0)::int AS qr_code_count
     FROM products p
     WHERE p.id = $1`,
    [id]
  )
  return result.rows[0] ?? null
}

export async function findAll(filters: {
  is_active?: boolean
  search?: string
  page: number
  page_size: number
}): Promise<{ rows: ProductWithCounts[]; total: number }> {
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (filters.is_active !== undefined) {
    conditions.push(`p.is_active = $${paramIndex++}`)
    params.push(filters.is_active)
  }

  if (filters.search) {
    conditions.push(`(p.name ILIKE $${paramIndex} OR p.category ILIKE $${paramIndex})`)
    params.push(`%${filters.search}%`)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (filters.page - 1) * filters.page_size

  const countResult = await pool.query(
    `SELECT count(*) AS total FROM products p ${whereClause}`,
    params
  )
  const total = parseInt(countResult.rows[0].total, 10)

  const dataResult = await pool.query<ProductWithCounts>(
    `SELECT p.*,
       COALESCE((SELECT count(*) FROM batches b WHERE b.product_id = p.id), 0)::int AS batch_count,
       COALESCE((SELECT count(*) FROM qr_codes q JOIN batches b ON q.batch_id = b.id WHERE b.product_id = p.id), 0)::int AS qr_code_count
     FROM products p
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, filters.page_size, offset]
  )

  return { rows: dataResult.rows, total }
}

export async function update(id: string, data: {
  name?: string
  category?: string
  description?: string
  photo_url?: string
}): Promise<Product | null> {
  const setClauses: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`)
    params.push(data.name)
  }
  if (data.category !== undefined) {
    setClauses.push(`category = $${paramIndex++}`)
    params.push(data.category)
  }
  if (data.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`)
    params.push(data.description)
  }
  if (data.photo_url !== undefined) {
    setClauses.push(`photo_url = $${paramIndex++}`)
    params.push(data.photo_url)
  }

  if (setClauses.length === 0) return null

  setClauses.push(`updated_at = NOW()`)
  params.push(id)

  const result = await pool.query<Product>(
    `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  )
  return result.rows[0] ?? null
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1',
    [id]
  )
  return (result.rowCount ?? 0) > 0
}

export async function toggleArchive(id: string): Promise<{ id: string; is_active: boolean } | null> {
  const result = await pool.query<{ id: string; is_active: boolean }>(
    `UPDATE products SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1
     RETURNING id, is_active`,
    [id]
  )
  return result.rows[0] ?? null
}

export async function hasLockedBatches(productId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS(
       SELECT 1 FROM batches WHERE product_id = $1 AND is_locked = true
     ) AS has_locked`,
    [productId]
  )
  return result.rows[0].has_locked
}
