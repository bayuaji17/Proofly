import type { ComponentPropsWithoutRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'error' | 'ghost' | 'neutral'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantMap: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  error: 'btn-error',
  ghost: 'btn-ghost',
  neutral: 'btn-neutral',
}

const sizeMap: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    variantMap[variant],
    sizeMap[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <span className="loading loading-spinner" />}
      {children}
    </button>
  )
}
