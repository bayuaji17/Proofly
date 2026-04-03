import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Sidebar } from '#/components/layout/sidebar'
import { AdminNavbar } from '#/components/layout/admin-navbar'
import { authStore } from '#/lib/auth-store'
import { api } from '#/lib/api'

export const Route = createFileRoute('/admin')({
  // SPA — no SSR for admin pages
  ssr: false,

  beforeLoad: async () => {
    // 1. Token already in memory → proceed
    if (authStore.getToken()) return

    // 2. Try to refresh using HttpOnly cookie
    try {
      const res = await api.post<{ data: { access_token: string } }>(
        '/api/auth/refresh',
        undefined,
        { skipAuth: true },
      )
      authStore.setToken(res.data.access_token)
    } catch {
      // 3. Refresh failed → redirect to login
      throw redirect({ to: '/login' })
    }
  },

  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="drawer lg:drawer-open">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-screen flex-col bg-base-100">
        <AdminNavbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <Sidebar />
    </div>
  )
}
