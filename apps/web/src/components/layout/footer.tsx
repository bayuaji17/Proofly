import { Link } from '@tanstack/react-router'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-base-200 bg-base-200 px-4 py-6 text-center text-sm text-base-content/60">
      <p>© {year} Proofly. All rights reserved.</p>
      <Link to="/login" className="link link-hover mt-1 inline-block text-xs">
        Admin
      </Link>
    </footer>
  )
}
