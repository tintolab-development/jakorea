import type { ReactNode } from 'react'
import { PFText } from '../pf-text'
import styles from './pf-info-review.module.css'

export type PFInfoReviewItem = {
  label: string
  value: ReactNode
}

export type PFInfoReviewProps = {
  rows: PFInfoReviewItem[]
  className?: string
}

export function PFInfoReview({ rows, className }: PFInfoReviewProps) {
  return (
    <div className={[styles.list, className].filter(Boolean).join(' ')}>
      {rows.map((row, index) => (
        <div
          className={[styles.row, index === 0 ? styles.rowFirst : undefined].filter(Boolean).join(' ')}
          key={row.label}
        >
          <PFText typo="bd-md-md" color="neutral-cool-500" className={styles.label}>
            {row.label}
          </PFText>
          {typeof row.value === 'string' || typeof row.value === 'number' ? (
            <PFText typo="bd-md-sb" color="black" className={styles.value}>
              {row.value}
            </PFText>
          ) : (
            <div className={styles.value}>{row.value}</div>
          )}
        </div>
      ))}
    </div>
  )
}
