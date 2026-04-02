import { pool } from '../connection.js'
import type { Admin } from '../../types/database.js'

export async function findByEmail(email: string): Promise<Admin | null> {
  const result = await pool.query<Admin>(
    'SELECT * FROM admin WHERE email = $1',
    [email]
  )
  return result.rows[0] ?? null
}

export async function findById(id: string): Promise<Admin | null> {
  const result = await pool.query<Admin>(
    'SELECT * FROM admin WHERE id = $1',
    [id]
  )
  return result.rows[0] ?? null
}

export async function countAdmins(): Promise<number> {
  const result = await pool.query('SELECT count(*) as total FROM admin')
  return parseInt(result.rows[0].total, 10)
}

export async function createAdmin(email: string, passwordHash: string): Promise<Admin> {
  const result = await pool.query<Admin>(
    `INSERT INTO admin (email, password_hash) 
     VALUES ($1, $2) RETURNING *`,
    [email, passwordHash]
  )
  return result.rows[0]
}
