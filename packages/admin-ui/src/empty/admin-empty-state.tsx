import type { ReactNode } from 'react'
import { joinClassNames } from '../lib/join-class-names.js'
import './admin-empty-state.css'

export type AdminEmptyStateVariant = 'no-data' | 'no-search'

export interface AdminEmptyStateProps {
  title: string
  description?: string | null
  icon?: ReactNode
  action?: ReactNode
  variant?: AdminEmptyStateVariant
  className?: string
}

export function AdminEmptyState({
  title,
  description,
  icon,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div className={joinClassNames('cms-table-empty-state', className)} role="status">
      {icon ? (
        <span className="cms-table-empty-state__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <div className="cms-table-empty-state__texts">
        <p className="cms-table-empty-state__title">{title}</p>
        {description ? <p className="cms-table-empty-state__description">{description}</p> : null}
      </div>
      {action ? <div className="cms-table-empty-state__action">{action}</div> : null}
    </div>
  )
}
