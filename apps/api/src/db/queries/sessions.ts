import { pool } from '../connection.js'
import type { AdminSession } from '../../types/database.js'

const MAX_SESSIONS_PER_ADMIN = 5

export async function createSession(adminId: string, refreshToken: string, expiresAt: Date): Promise<AdminSession> {
  const result = await pool.query<AdminSession>(
    `INSERT INTO admin_sessions (admin_id, refresh_token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [adminId, refreshToken, expiresAt]
  )
  return result.rows[0]
}

export async function findByToken(refreshToken: string): Promise<AdminSession | null> {
  const result = await pool.query<AdminSession>(
    'SELECT * FROM admin_sessions WHERE refresh_token = $1',
    [refreshToken]
  )
  return result.rows[0] ?? null
}

export async function deleteSession(refreshToken: string): Promise<void> {
  await pool.query(
    'DELETE FROM admin_sessions WHERE refresh_token = $1',
    [refreshToken]
  )
}

/**
 * Rotate refresh token atomically within a single DB transaction.
 * Deletes old token and creates new one — if either fails, both rollback.
 */
export async function rotateSession(
  oldRefreshToken: string,
  adminId: string,
  newRefreshToken: string,
  newExpiresAt: Date
): Promise<AdminSession> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      'DELETE FROM admin_sessions WHERE refresh_token = $1',
      [oldRefreshToken]
    )

    const result = await client.query<AdminSession>(
      `INSERT INTO admin_sessions (admin_id, refresh_token, expires_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [adminId, newRefreshToken, newExpiresAt]
    )

    await client.query('COMMIT')
    return result.rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/**
 * Enforce a maximum number of active sessions per admin.
 * Deletes the oldest sessions that exceed the limit.
 */
export async function enforceSessionLimit(adminId: string): Promise<void> {
  await pool.query(
    `DELETE FROM admin_sessions
     WHERE id IN (
       SELECT id FROM admin_sessions
       WHERE admin_id = $1
       ORDER BY created_at DESC
       OFFSET $2
     )`,
    [adminId, MAX_SESSIONS_PER_ADMIN]
  )
}

/**
 * Remove all sessions that have passed their expiration date.
 * Call periodically (e.g., on login) to keep the table clean.
 */
export async function deleteExpiredSessions(): Promise<number> {
  const result = await pool.query(
    'DELETE FROM admin_sessions WHERE expires_at < NOW()'
  )
  return result.rowCount ?? 0
}
