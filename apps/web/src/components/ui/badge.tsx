import {
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Lock,
  Unlock,
} from 'lucide-react'
import type { ReactNode } from 'react'

type BadgeVariant =
  | 'genuine'
  | 'counterfeit'
  | 'not-found'
  | 'locked'
  | 'unlocked'
  | 'info'

const config: Record<
  BadgeVariant,
  { className: string; Icon?: typeof ShieldCheck }
> = {
  genuine: { className: 'badge-success', Icon: ShieldCheck },
  counterfeit: { className: 'badge-error', Icon: ShieldAlert },
  'not-found': { className: 'badge-warning', Icon: HelpCircle },
  locked: { className: 'badge-neutral', Icon: Lock },
  unlocked: { className: 'badge-info', Icon: Unlock },
  info: { className: 'badge-info' },
}

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

export function Badge({ variant, children }: BadgeProps) {
  const { className, Icon } = config[variant]

  return (
    <span className={`badge gap-1 ${className}`}>
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  )
}
