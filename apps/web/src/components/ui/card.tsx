import type { ComponentPropsWithoutRef, ReactNode } from 'react'

interface CardProps extends ComponentPropsWithoutRef<'div'> {
  title?: string
  compact?: boolean
  actions?: ReactNode
}

export function Card({
  title,
  compact = false,
  actions,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`card bg-base-100 shadow-sm ${compact ? 'card-compact' : ''} ${className}`}
      {...rest}
    >
      <div className="card-body">
        {title && <h2 className="card-title">{title}</h2>}
        {children}
        {actions && <div className="card-actions justify-end">{actions}</div>}
      </div>
    </div>
  )
}
