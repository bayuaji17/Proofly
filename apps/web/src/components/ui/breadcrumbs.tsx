import { Link } from '@tanstack/react-router'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="breadcrumbs text-base font-heading mb-8">
      <ul>
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={item.label}>
              {item.href && !isLast ? (
                // @ts-ignore - dynamic href is fine for generic breadcrumbs
                <Link to={item.href} className="text-base-content/70 hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-base-content' : 'text-base-content/70'}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
