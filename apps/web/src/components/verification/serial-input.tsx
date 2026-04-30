import { useState } from 'react'
import { Search } from 'lucide-react'

interface SerialInputProps {
  onSubmit: (serialNumber: string) => void
  disabled?: boolean
}

export function SerialInput({ onSubmit, disabled = false }: SerialInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleaned = value.trim().toUpperCase().replace(/[\s-]/g, '')

    if (cleaned.length === 0) {
      setError('Serial number wajib diisi')
      return
    }

    if (!/^[A-Z0-9]{12}$/.test(cleaned)) {
      setError('Format serial number tidak valid. Gunakan format XXXX-XXXX-XXXX (12 karakter)')
      return
    }

    const formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`
    onSubmit(formatted)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <div>
        <label htmlFor="serial-input" className="block text-sm font-medium text-neutral-700 mb-1.5">
          Serial Number
        </label>
        <input
          id="serial-input"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase())
            setError(null)
          }}
          placeholder="XXXX-XXXX-XXXX"
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-lg tracking-widest text-neutral-900 placeholder-neutral-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
        />
        {error && (
          <p className="mt-1.5 text-xs text-error">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="btn btn-primary gap-2"
      >
        <Search className="size-4" />
        Verifikasi
      </button>
    </form>
  )
}
