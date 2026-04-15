import { pool } from '../connection.js'
import type { JobQueue } from '../../types/database.js'

/**
 * Insert a new job into the queue
 */
export async function createJob(
  type: string,
  payload: Record<string, unknown>,
  client?: any
): Promise<JobQueue> {
  const db = client || pool
  const result = await (db as typeof pool).query<JobQueue>(
    `INSERT INTO job_queue (type, payload)
     VALUES ($1, $2)
     RETURNING *`,
    [type, JSON.stringify(payload)]
  )
  return result.rows[0]
}

/**
 * Atomically claim the next pending job of a given type.
 * Uses SELECT FOR UPDATE SKIP LOCKED to handle concurrency safely.
 */
export async function claimNextJob(type: string): Promise<JobQueue | null> {
  const result = await pool.query<JobQueue>(
    `UPDATE job_queue
     SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
     WHERE id = (
       SELECT id FROM job_queue
       WHERE type = $1 AND status = 'pending'
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [type]
  )
  return result.rows[0] ?? null
}

/**
 * Mark a job as completed
 */
export async function completeJob(id: string): Promise<void> {
  await pool.query(
    `UPDATE job_queue SET status = 'completed', updated_at = NOW() WHERE id = $1`,
    [id]
  )
}

/**
 * Mark a job as failed. If attempts >= max_attempts, status stays 'failed'.
 * Otherwise, reset to 'pending' for retry.
 */
export async function failJob(id: string, error: string): Promise<JobQueue> {
  const result = await pool.query<JobQueue>(
    `UPDATE job_queue
     SET error = $2,
         updated_at = NOW(),
         status = CASE
           WHEN attempts >= max_attempts THEN 'failed'
           ELSE 'pending'
         END
     WHERE id = $1
     RETURNING *`,
    [id, error]
  )
  return result.rows[0]
}
