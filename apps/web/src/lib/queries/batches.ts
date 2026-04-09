import { queryOptions } from '@tanstack/react-query'
import { api } from '#/lib/api'
import type { Batch } from '#/types/models'

/* ------------------------------------------------------------------ */
/*  Query Options                                                      */
/* ------------------------------------------------------------------ */

export function batchesQueryOptions(productId: string) {
  return queryOptions({
    queryKey: ['batches', productId],
    queryFn: () =>
      api.get<{ data: Batch[] }>(`/api/products/${productId}/batches`),
  })
}

export function batchQueryOptions(batchId: string) {
  return queryOptions({
    queryKey: ['batches', 'detail', batchId],
    queryFn: () => api.get<{ data: Batch }>(`/api/batches/${batchId}`),
  })
}

/* ------------------------------------------------------------------ */
/*  Mutation Helpers                                                   */
/* ------------------------------------------------------------------ */

export interface CreateBatchInput {
  batch_number: string
  quantity: number
  production_date: string
  expiry_date: string
}

export async function createBatchMutation(
  productId: string,
  data: CreateBatchInput,
) {
  return api.post<{ data: Batch }>(
    `/api/products/${productId}/batches`,
    data,
  )
}

export async function updateBatchMutation(
  batchId: string,
  data: Partial<CreateBatchInput>,
) {
  return api.put<{ data: Batch }>(`/api/batches/${batchId}`, data)
}

export async function deleteBatchMutation(batchId: string) {
  return api.delete<{ success: boolean; message: string }>(
    `/api/batches/${batchId}`,
  )
}
