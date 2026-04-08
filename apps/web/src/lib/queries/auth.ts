import { queryOptions } from '@tanstack/react-query'
import { api } from '#/lib/api'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface AdminUser {
  id: string
  email: string
}

interface MeResponse {
  data: AdminUser
}

interface LoginResponse {
  data: {
    access_token: string
    admin: AdminUser
  }
}

/* ------------------------------------------------------------------ */
/*  Query Options                                                     */
/* ------------------------------------------------------------------ */

export function meQueryOptions() {
  return queryOptions({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<MeResponse>('/api/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/* ------------------------------------------------------------------ */
/*  Mutation helpers                                                  */
/* ------------------------------------------------------------------ */

export async function loginMutation(credentials: {
  email: string
  password: string
}): Promise<LoginResponse> {
  return api.post<LoginResponse>('/api/auth/login', credentials, { skipAuth: true })
}

export async function logoutMutation(): Promise<void> {
  await api.post('/api/auth/logout')
}
