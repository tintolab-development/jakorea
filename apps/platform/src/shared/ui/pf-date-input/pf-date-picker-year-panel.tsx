import { useState } from 'react'
import { PFPageButton } from '../pf-page-button'
import {
  canNavigateDecadeNext,
  canNavigateDecadePrev,
  formatDisplayYear,
  getDecadePanelYears,
  getDecadeStart,
  isYearWithinInputBounds,
  parseYear,
  toYearValue,
} from './date-utils'
import styles from './pf-date-input.module.css'

export type PFDatePickerYearPanelProps = {
  /** `YYYY` */
  selectedYear?: string | null
  initialViewYear?: number
  onSelectYear?: (yearValue: string) => void
  className?: string
  id?: string
  'aria-label'?: string
}

export function PFDatePickerYearPanel({
  selectedYear = null,
  initialViewYear,
  onSelectYear,
  className,
  id,
  'aria-label': ariaLabel = '연도 선택',
}: PFDatePickerYearPanelProps) {
  const selected = selectedYear ? parseYear(selectedYear) : null
  const [decadeStart, setDecadeStart] = useState(() =>
    getDecadeStart(initialViewYear ?? selected ?? new Date().getFullYear())
  )

  const years = getDecadePanelYears(decadeStart)
  const decadeLabel = `${decadeStart}-${decadeStart + 9}`

  return (
    <div
      id={id}
      className={[styles.popover, styles.yearPopover, className].filter(Boolean).join(' ')}
      role="dialog"
      aria-label={ariaLabel}
    >
      <div className={styles.yearHeaderBlock}>
        <div className={styles.header}>
          <PFPageButton
            size="large"
            direction="left"
            aria-label="이전 10년"
            disabled={!canNavigateDecadePrev(decadeStart)}
            onClick={() => setDecadeStart(prev => prev - 10)}
          />
          <p className={styles.yearMonth}>{decadeLabel}</p>
          <PFPageButton
            size="large"
            direction="right"
            aria-label="다음 10년"
            disabled={!canNavigateDecadeNext(decadeStart)}
            onClick={() => setDecadeStart(prev => prev + 10)}
          />
        </div>
        <div className={styles.headerRule} aria-hidden="true" />
      </div>

      <div className={styles.yearGrid}>
        {years.map(year => {
          const isOutside = year < decadeStart || year > decadeStart + 9
          const isDisabled = !isYearWithinInputBounds(year)
          const isSelected = selected === year
          const yearClassName = [
            styles.yearCell,
            isOutside ? styles.dayOutside : undefined,
            isDisabled ? styles.dayDisabled : undefined,
            isSelected ? styles.daySelected : undefined,
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={year}
              type="button"
              className={yearClassName}
              disabled={isDisabled}
              aria-label={`${year}년`}
              aria-pressed={isSelected}
              onClick={() => {
                if (isDisabled) return
                onSelectYear?.(toYearValue(year))
              }}
            >
              {formatDisplayYear(toYearValue(year))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
