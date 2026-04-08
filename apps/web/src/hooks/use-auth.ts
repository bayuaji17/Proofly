import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { authStore } from '#/lib/auth-store'
import { meQueryOptions, loginMutation, logoutMutation } from '#/lib/queries/auth'
import { toast } from '#/components/ui/toast'
import type { AdminUser } from '#/lib/queries/auth'

/* ------------------------------------------------------------------ */
/*  useAuth — encapsulates the full auth lifecycle                    */
/* ------------------------------------------------------------------ */

interface UseAuthReturn {
  admin: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch current admin data — only when a token exists in memory
  const { data, isLoading } = useQuery({
    ...meQueryOptions(),
    enabled: !!authStore.getToken(),
  })

  const admin = data?.data ?? null
  const isAuthenticated = !!authStore.getToken() && !!admin

  /* ---- login ---- */

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginMutation({ email, password })

      // Store access token in memory (NOT localStorage)
      authStore.setToken(response.data.access_token)

      // Seed the query cache with admin data so we don't need an extra fetch
      queryClient.setQueryData(meQueryOptions().queryKey, {
        data: response.data.admin,
      })

      navigate({ to: '/admin' })
    },
    [queryClient, navigate],
  )

  /* ---- logout ---- */

  const logout = useCallback(async () => {
    try {
      await logoutMutation()
    } catch {
      // Proceed with client-side cleanup even if server call fails
    }

    authStore.clear()
    queryClient.removeQueries({ queryKey: ['auth'] })
    toast.success('Berhasil logout')
    navigate({ to: '/login' })
  }, [queryClient, navigate])

  return { admin, isAuthenticated, isLoading, login, logout }
}
