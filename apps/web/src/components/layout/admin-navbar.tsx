import { Menu, Bell } from 'lucide-react'

export function AdminNavbar() {
  return (
    <nav className="navbar border-b border-base-200 bg-base-100">
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
      </div>
    </nav>
  )
}
