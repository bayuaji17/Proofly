import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleCheck, CircleX, TriangleAlert, Info, X } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null)

function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be inside ToastProvider')
  return ctx
}

/* ------------------------------------------------------------------ */
/*  Imperative API (callable from anywhere, including lib/api.ts)     */
/* ------------------------------------------------------------------ */

let globalAddToast: ((type: ToastType, message: string) => void) | null = null

export const toast = {
  success: (message: string) => globalAddToast?.('success', message),
  error: (message: string) => globalAddToast?.('error', message),
  warning: (message: string) => globalAddToast?.('warning', message),
  info: (message: string) => globalAddToast?.('info', message),
}

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

const MAX_TOASTS = 3
const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Register imperative API
  useEffect(() => {
    globalAddToast = addToast
    return () => {
      globalAddToast = null
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  Container                                                         */
/* ------------------------------------------------------------------ */

const typeConfig: Record<ToastType, { className: string; Icon: typeof Info }> = {
  success: { className: 'alert-success', Icon: CircleCheck },
  error: { className: 'alert-error', Icon: CircleX },
  warning: { className: 'alert-warning', Icon: TriangleAlert },
  info: { className: 'alert-info', Icon: Info },
}

function ToastContainer() {
  const { toasts, removeToast } = useToastContext()

  return (
    <div className="toast toast-center toast-top z-50">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Single toast item                                                 */
/* ------------------------------------------------------------------ */

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const { className, Icon } = typeConfig[t.type]

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(t.id), AUTO_DISMISS_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [t.id, onDismiss])

  return (
    <div role="alert" className={`alert ${className} shadow-lg`}>
      <Icon className="size-4 shrink-0" />
      <span className="text-sm">{t.message}</span>
      <button
        className="btn btn-ghost btn-xs"
        onClick={() => onDismiss(t.id)}
        aria-label="Tutup notifikasi"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}
