import { HTTPException } from 'hono/http-exception'
import * as productQueries from '../db/queries/products.js'
import * as storageService from './storage.service.js'
import type { CreateProductInput } from '../validators/product.schema.js'

export async function createProduct(adminId: string, data: CreateProductInput) {
  return await productQueries.create(adminId, data)
}

export async function getProduct(id: string) {
  const product = await productQueries.findById(id)
  if (!product) {
    throw new HTTPException(404, { message: 'Product not found' })
  }
  return product
}

export async function listProducts(filters: {
  is_active?: boolean
  search?: string
  page: number
  page_size: number
}) {
  return await productQueries.findAll(filters)
}

export async function updateProduct(id: string, data: {
  name?: string
  category?: string
  description?: string
  photo_url?: string
}) {
  // Check existence first
  const existing = await productQueries.findById(id)
  if (!existing) {
    throw new HTTPException(404, { message: 'Product not found' })
  }

  const updated = await productQueries.update(id, data)
  return updated
}

export async function deleteProduct(id: string) {
  const existing = await productQueries.findById(id)
  if (!existing) {
    throw new HTTPException(404, { message: 'Product not found' })
  }

  const locked = await productQueries.hasLockedBatches(id)
  if (locked) {
    throw new HTTPException(409, {
      message: 'Cannot delete product with locked batches. Archive it instead.'
    })
  }

  // Cleanup photo from R2
  if (existing.photo_url) {
    const key = storageService.extractKeyFromUrl(existing.photo_url)
    if (key) {
      try {
        await storageService.deleteObject(key)
      } catch {
        // Log but don't fail — product deletion is more important
        console.error(`Failed to delete R2 object: ${key}`)
      }
    }
  }

  await productQueries.remove(id)
}

export async function archiveProduct(id: string) {
  const result = await productQueries.toggleArchive(id)
  if (!result) {
    throw new HTTPException(404, { message: 'Product not found' })
  }
  return result
}
