import { queryOptions } from '@tanstack/react-query'
import { api } from '#/lib/api'
import type { Product, PaginatedResponse } from '#/types/models'

/* ------------------------------------------------------------------ */
/*  Query Options                                                      */
/* ------------------------------------------------------------------ */

export interface ProductFilters {
  is_active?: string
  search?: string
  page?: number
  page_size?: number
}

export function productsQueryOptions(filters: ProductFilters = {}) {
  return queryOptions({
    queryKey: ['products', filters],
    queryFn: () => {
      const params = new URLSearchParams()

      if (filters.is_active !== undefined) params.set('is_active', filters.is_active)
      if (filters.search) params.set('search', filters.search)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.page_size) params.set('page_size', String(filters.page_size))

      const qs = params.toString()
      return api.get<PaginatedResponse<Product>>(`/api/products${qs ? `?${qs}` : ''}`)
    },
  })
}

export function productQueryOptions(productId: string) {
  return queryOptions({
    queryKey: ['products', productId],
    queryFn: () => api.get<{ data: Product }>(`/api/products/${productId}`),
  })
}

/* ------------------------------------------------------------------ */
/*  Mutation Helpers                                                   */
/* ------------------------------------------------------------------ */

export interface CreateProductInput {
  name: string
  category: string
  description: string
  photo_url?: string
}

export async function createProductMutation(data: CreateProductInput) {
  return api.post<{ data: Product }>('/api/products', data)
}

export async function updateProductMutation(
  id: string,
  data: Partial<CreateProductInput>,
) {
  return api.put<{ data: Product }>(`/api/products/${id}`, data)
}

export async function deleteProductMutation(id: string) {
  return api.delete<{ success: boolean; message: string }>(`/api/products/${id}`)
}

export async function archiveProductMutation(id: string) {
  return api.patch<{ data: { id: string; is_active: boolean } }>(
    `/api/products/${id}/archive`,
  )
}
