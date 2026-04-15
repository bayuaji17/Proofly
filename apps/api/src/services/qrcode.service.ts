import { HTTPException } from 'hono/http-exception'
import { pool } from '../db/connection.js'
import * as batchQueries from '../db/queries/batches.js'
import * as qrcodeQueries from '../db/queries/qrcodes.js'
import * as jobQueries from '../db/queries/jobs.js'
import { generateBulkSerialNumbers } from '../utils/serial-generator.js'

const MAX_COLLISION_RETRIES = 3

export async function generateForBatch(batchId: string) {
  // 1. Verify batch exists
  const batch = await batchQueries.findById(batchId)
  if (!batch) {
    throw new HTTPException(404, { message: 'Batch not found' })
  }

  // 2. Check not already locked
  if (batch.is_locked) {
    throw new HTTPException(409, {
      message: 'QR codes have already been generated for this batch'
    })
  }

  // 3. Generate serial numbers with collision detection
  let serialNumbers = generateBulkSerialNumbers(batch.quantity)

  for (let retry = 0; retry < MAX_COLLISION_RETRIES; retry++) {
    const collisions = await qrcodeQueries.findExistingSerialNumbers(serialNumbers)

    if (collisions.length === 0) break

    if (retry === MAX_COLLISION_RETRIES - 1) {
      throw new HTTPException(500, {
        message: 'Failed to generate unique serial numbers after multiple retries'
      })
    }

    // Replace collided serial numbers
    const collisionSet = new Set(collisions)
    const cleanSerials = serialNumbers.filter((sn) => !collisionSet.has(sn))
    const replacements = generateBulkSerialNumbers(collisions.length)
    serialNumbers = [...cleanSerials, ...replacements]
  }

  // 4. Atomic transaction: bulk insert QR codes + lock batch + set pdf_status + enqueue job
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await qrcodeQueries.bulkCreate(client, batchId, serialNumbers)
    await qrcodeQueries.lockBatch(client, batchId)

    // Set pdf_status to 'processing'
    await client.query(
      `UPDATE batches SET pdf_status = 'processing', updated_at = NOW() WHERE id = $1`,
      [batchId]
    )

    // Enqueue PDF generation job
    await jobQueries.createJob('generate_pdf', { batch_id: batchId }, client)

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return {
    batch_id: batchId,
    total_generated: serialNumbers.length,
    serial_numbers: serialNumbers
  }
}

export async function listQrCodes(
  batchId: string,
  pagination: { page: number; page_size: number }
) {
  // Verify batch exists
  const batch = await batchQueries.findById(batchId)
  if (!batch) {
    throw new HTTPException(404, { message: 'Batch not found' })
  }

  return await qrcodeQueries.findByBatchId(batchId, pagination)
}
