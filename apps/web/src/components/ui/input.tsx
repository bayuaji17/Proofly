import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className = '', id, ...rest }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <fieldset className="fieldset">
        {label && (
          <legend className="fieldset-legend">{label}</legend>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`input w-full ${error ? 'input-error' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />

        {error && (
          <p
            id={`${inputId}-error`}
            className="fieldset-label text-error text-sm"
          >
            {error}
          </p>
        )}
      </fieldset>
    )
  },
)
