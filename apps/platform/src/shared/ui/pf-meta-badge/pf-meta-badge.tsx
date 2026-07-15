import type { ReactNode } from 'react'
import styles from './pf-meta-badge.module.css'

export type PFMetaBadgeProps = {
  icon: ReactNode
  primary: ReactNode
  secondary?: ReactNode
  className?: string
}

export function PFMetaBadge({ icon, primary, secondary, className }: PFMetaBadgeProps) {
  const badgeClassName = [styles.badge, 'typo-bd-md-sb', className].filter(Boolean).join(' ')

  return (
    <span className={badgeClassName}>
      <span className={styles.iconSlot}>{icon}</span>
      <span className={styles.textGroup}>
        <span className={styles.primary}>{primary}</span>
        {secondary != null ? (
          <>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.secondary}>{secondary}</span>
          </>
        ) : null}
      </span>
    </span>
  )
}
