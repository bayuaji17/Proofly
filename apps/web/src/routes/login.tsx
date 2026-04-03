import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { authStore } from '#/lib/auth-store'
import { Hexagon } from 'lucide-react'

export const Route = createFileRoute('/login')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Login — Proofly Admin' }],
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (authStore.getToken()) {
      navigate({ to: '/admin' })
    }
  }, [navigate])

  return (
    <div className="flex bg-slate-50 min-h-screen flex-col items-center justify-center px-4 py-12 font-sans selection:bg-primary/20">
      
      <div className="w-full max-w-[400px]">
        {/* Brand/Logo outside card */}
        <div className="mb-8 flex flex-col items-center">
          <Hexagon className="size-10 text-primary fill-primary/10 mb-4" />
          <h1 className="text-2xl font-display font-semibold tracking-tight text-neutral-900">
            Log in to Proofly
          </h1>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
            className="flex flex-col gap-5"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@proofly.id"
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
              />
            </div>

            <button 
              type="submit" 
              className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-content shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Continue
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <p className="text-xs text-neutral-500">
               Protected area. Integration active on Sprint 1.
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
