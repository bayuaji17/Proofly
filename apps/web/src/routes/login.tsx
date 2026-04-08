import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { authStore } from '#/lib/auth-store'
import { LoginForm } from '#/components/forms/login-form'
import { ApiError } from '#/lib/api'
import { loginMutation, meQueryOptions } from '#/lib/queries/auth'
import { toast } from '#/components/ui/toast'
import { Hexagon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/login')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Login — Proofly Admin' }],
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // If already authenticated, redirect to admin
  useEffect(() => {
    if (authStore.getToken()) {
      navigate({ to: '/admin' })
    }
  }, [navigate])

  async function handleLogin(values: { email: string; password: string }) {
    setFormError(null)
    setIsSubmitting(true)

    try {
      const response = await loginMutation(values)

      // Store access token in memory
      authStore.setToken(response.data.access_token)

      // Seed the query cache with admin data
      queryClient.setQueryData(meQueryOptions().queryKey, {
        data: response.data.admin,
      })

      toast.success('Login berhasil!')
      navigate({ to: '/admin' })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setFormError('Email atau password salah')
        } else {
          setFormError(err.message || 'Terjadi kesalahan, coba lagi')
        }
        toast.error('Login gagal')
      } else {
        setFormError('Tidak dapat terhubung ke server')
        toast.error('Tidak dapat terhubung ke server')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-screen flex-col items-center justify-center px-4 py-12 font-sans selection:bg-primary/20">

      <div className="w-full max-w-[400px]">
        {/* Brand/Logo outside card */}
        <div className="mb-8 flex flex-col items-center">
          <Hexagon className="size-10 text-primary fill-primary/10 mb-4" />
          <h1 className="text-2xl font-heading font-semibold tracking-tight text-neutral-900">
            Log in to Proofly
          </h1>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <LoginForm
            onSubmit={handleLogin}
            isSubmitting={isSubmitting}
            error={formError}
          />
        </div>
      </div>
    </div>
  )
}
