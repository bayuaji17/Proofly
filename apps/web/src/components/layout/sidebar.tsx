import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Bell,
  LogOut,
  User,
} from 'lucide-react'
import { useAuth } from '#/hooks/use-auth'

interface NavItem {
  to: string
  label: string
  Icon: typeof LayoutDashboard
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', Icon: Package },
  { to: '/admin/analytics', label: 'Analytics', Icon: BarChart3 },
  { to: '/admin/notifications', label: 'Notifications', Icon: Bell },
]

export function Sidebar() {
  const { admin, logout } = useAuth()

  return (
    <div className="drawer-side z-30">
      <label
        htmlFor="admin-drawer"
        aria-label="Tutup sidebar"
        className="drawer-overlay"
      />

      <aside className="flex min-h-full w-64 flex-col bg-base-200">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-base-200 shadow-sm">
          <span className="text-xl font-bold font-display">Proofly</span>
        </div>

        {/* Navigation */}
        <ul className="menu flex-1 gap-1 px-3 w-full">
          {navItems.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: !!end }}
                activeProps={{ className: 'active' }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Admin info + Logout */}
        <div className="border-t border-base-300 p-3">
          {admin && (
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-base-content">
                  {admin.email}
                </p>
                <p className="text-[10px] text-base-content/50">
                  Administrator
                </p>
              </div>
            </div>
          )}
          <button
            className="btn btn-ghost btn-sm w-full justify-start gap-2 text-error"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>
    </div>
  )
}
