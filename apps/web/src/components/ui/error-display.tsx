import { AlertCircle } from 'lucide-react'
import { Button } from './button'

interface ErrorDisplayProps {
  error: Error
  reset?: () => void
}

export function ErrorDisplay({ error, reset }: ErrorDisplayProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div role="alert" className="alert alert-error max-w-lg">
        <AlertCircle className="size-5 shrink-0" />

        <div>
          <h3 className="font-bold">Terjadi Kesalahan</h3>
          <p className="text-sm">{error.message}</p>
        </div>

        {reset && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Coba Lagi
          </Button>
        )}
      </div>
    </div>
  )
}
