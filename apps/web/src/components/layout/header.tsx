import { Link } from '@tanstack/react-router'
import { Hexagon } from 'lucide-react'

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1 items-center gap-2">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <Hexagon className="size-7 text-primary fill-primary/10" />
            <span className="text-xl font-bold tracking-tight text-neutral-900 font-display">Proofly</span>
          </Link>
        </div>
        <div className="hidden lg:flex gap-x-12">
          <Link to="/" className="text-sm/6 font-semibold text-neutral-600 hover:text-neutral-900 transition-colors">
            Tentang Kami
          </Link>
          <Link to="/verify" className="text-sm/6 font-semibold text-neutral-600 hover:text-neutral-900 transition-colors">
            Verifikasi
          </Link>
        </div>
        <div className="flex flex-1 justify-end items-center">
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold text-neutral-500 shadow-sm border border-slate-200">
            <button className="flex w-12 items-center justify-center rounded-md bg-white py-1 text-primary shadow-sm ring-1 ring-slate-200/50">
              ID
            </button>
            <button className="flex w-12 items-center justify-center py-1 hover:text-neutral-800 transition-colors">
              EN
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
