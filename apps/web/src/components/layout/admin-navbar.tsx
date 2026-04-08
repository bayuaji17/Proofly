import { Menu, Bell, LogOut, User } from 'lucide-react'
import { useAuth } from '#/hooks/use-auth'

export function AdminNavbar() {
  const { admin, logout } = useAuth()

  return (
    <nav className="navbar border-b border-base-200 bg-base-100 shadow-sm">
      {/* Mobile drawer toggle */}
      <div className="flex-none lg:hidden">
        <label
          htmlFor="admin-drawer"
          aria-label="Buka sidebar"
          className="btn btn-square btn-ghost btn-sm"
        >
          <Menu className="size-5" />
        </label>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-sm btn-circle" aria-label="Notifikasi">
          <Bell className="size-4" />
        </button>

        {/* Admin dropdown */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-3.5" />
            </div>
            {admin && (
              <span className="hidden text-xs font-medium sm:inline">
                {admin.email}
              </span>
            )}
          </div>
          <ul tabIndex={0} className="dropdown-content menu rounded-box z-10 mt-2 w-48 bg-base-100 p-2 shadow-lg border border-base-200">
            <li className="menu-title text-xs">
              <span>{admin?.email ?? 'Admin'}</span>
            </li>
            <li>
              <button onClick={logout} className="text-error">
                <LogOut className="size-4" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
