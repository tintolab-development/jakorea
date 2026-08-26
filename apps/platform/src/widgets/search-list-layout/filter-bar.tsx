import type { ReactNode } from 'react'
import { PFCircleIconButton } from '@/shared/ui'
import styles from './filter-bar.module.css'

type FilterBarProps = {
  children: ReactNode
  onReset?: () => void
  resetAriaLabel?: string
}

export function FilterBar({
  children,
  onReset,
  resetAriaLabel = '필터 초기화',
}: FilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.filters}>{children}</div>
      {onReset ? (
        <PFCircleIconButton
          icon="refresh"
          className={styles.resetButton}
          aria-label={resetAriaLabel}
          onClick={onReset}
        />
      ) : null}
    </div>
  )
}
