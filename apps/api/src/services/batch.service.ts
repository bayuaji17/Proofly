import { HTTPException } from 'hono/http-exception'
import * as batchQueries from '../db/queries/batches.js'
import * as productQueries from '../db/queries/products.js'
import type { CreateBatchInput } from '../validators/batch.schema.js'

export async function createBatch(productId: string, data: CreateBatchInput) {
  // Verify product exists
  const product = await productQueries.findById(productId)
  if (!product) {
    throw new HTTPException(404, { message: 'Product not found' })
  }

  try {
    return await batchQueries.create(productId, data)
  } catch (err: any) {
    // Handle UNIQUE constraint violation (product_id, batch_number)
    if (err.code === '23505') {
      throw new HTTPException(409, {
        message: `Batch number "${data.batch_number}" already exists for this product`
      })
    }
    throw err
  }
}

export async function getBatch(id: string) {
  const batch = await batchQueries.findById(id)
  if (!batch) {
    throw new HTTPException(404, { message: 'Batch not found' })
  }
  return batch
}

export async function listBatches(productId: string) {
  // Verify product exists
  const product = await productQueries.findById(productId)
  if (!product) {
    throw new HTTPException(404, { message: 'Product not found' })
  }

  return await batchQueries.findByProductId(productId)
}

export async function updateBatch(id: string, data: {
  batch_number?: string
  quantity?: number
  production_date?: string
  expiry_date?: string
}) {
  const existing = await batchQueries.findById(id)
  if (!existing) {
    throw new HTTPException(404, { message: 'Batch not found' })
  }

  if (existing.is_locked) {
    throw new HTTPException(409, {
      message: 'Cannot update a locked batch. QR codes have already been generated.'
    })
  }

  const updated = await batchQueries.update(id, data)
  return updated
}

export async function deleteBatch(id: string) {
  const existing = await batchQueries.findById(id)
  if (!existing) {
    throw new HTTPException(404, { message: 'Batch not found' })
  }

  if (existing.is_locked) {
    throw new HTTPException(409, {
      message: 'Cannot delete a locked batch. QR codes have already been generated.'
    })
  }

  await batchQueries.remove(id)
}
