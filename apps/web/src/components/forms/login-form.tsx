import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'


interface LoginFormProps {
  onSubmit: (values: { email: string; password: string }) => Promise<void>
  isSubmitting?: boolean
  error?: string | null
}

export function LoginForm({ onSubmit, isSubmitting = false, error }: LoginFormProps) {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-5 font-sans"
    >
      {/* Global error (e.g. invalid credentials from API) */}
      {error && (
        <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Email Field */}
      <form.Field
        name="email"
        validators={{
          onChangeListenTo: ['email'],
          onChange: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
        }}
        children={(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              id={field.name}
              type="email"
              placeholder="admin@proofly.id"
              autoComplete="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-error">
                {field.state.meta.errors.map((err) => (typeof err === 'string' ? err : err?.message ?? '')).join(', ')}
              </p>
            )}
          </div>
        )}
      />

      {/* Password Field */}
      <form.Field
        name="password"
        validators={{
          onChangeListenTo: ['password'],
          onChange: z.string().min(6, 'Password minimal 6 karakter'),
        }}
        children={(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              id={field.name}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-error">
                {field.state.meta.errors.map((err) => (typeof err === 'string' ? err : err?.message ?? '')).join(', ')}
              </p>
            )}
          </div>
        )}
      />

      {/* Submit Button */}
      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          values: state.values,
          isValid: state.isValid,
        })}
        children={({ canSubmit, values, isValid }) => {
          const isFilled = values.email.trim().length > 0 && values.password.trim().length > 0
          return (
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit || !isFilled || !isValid}
              className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-content shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Continue'
              )}
            </button>
          )
        }}
      />
    </form>
  )
}
