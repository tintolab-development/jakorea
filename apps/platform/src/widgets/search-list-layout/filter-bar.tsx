import type { ReactNode } from 'react'
import refreshGrayUrl from '@/shared/assets/icons/refresh-gray.svg'
import refreshMintUrl from '@/shared/assets/icons/refresh-mint.svg'
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
        <button
          type="button"
          className={styles.resetButton}
          aria-label={resetAriaLabel}
          onClick={onReset}
        >
          <img
            className={[styles.resetIcon, styles.resetIconDefault].join(' ')}
            src={refreshGrayUrl}
            alt=""
            aria-hidden="true"
          />
          <img
            className={[styles.resetIcon, styles.resetIconHover].join(' ')}
            src={refreshMintUrl}
            alt=""
            aria-hidden="true"
          />
        </button>
      ) : null}
    </div>
  )
}
