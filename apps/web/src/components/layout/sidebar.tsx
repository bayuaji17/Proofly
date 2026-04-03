import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Bell,
  LogOut,
} from 'lucide-react'
import { authStore } from '#/lib/auth-store'
import { api } from '#/lib/api'

const navItems = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', Icon: Package },
  { to: '/admin/analytics', label: 'Analytics', Icon: BarChart3 },
  { to: '/admin/notifications', label: 'Notifications', Icon: Bell },
] as const

export function Sidebar() {
  async function handleLogout() {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Proceed with client-side cleanup even if server call fails
    }
    authStore.clear()
    window.location.href = '/login'
  }

  return (
    <div className="drawer-side z-30">
      <label htmlFor="admin-drawer" aria-label="Tutup sidebar" className="drawer-overlay" />

      <aside className="flex min-h-full w-64 flex-col bg-base-200">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 px-6">
          <span className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>
            Proofly
          </span>
          <span className="badge badge-sm badge-primary">Admin</span>
        </div>

        {/* Navigation */}
        <ul className="menu flex-1 gap-1 px-3">
          {navItems.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: end }}
                activeProps={{ className: 'active' }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <div className="border-t border-base-300 p-3">
          <button
            className="btn btn-ghost btn-sm w-full justify-start gap-2 text-error"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>
    </div>
  )
}
