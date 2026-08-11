import { useState } from 'react'
import { PFPageButton } from '../pf-page-button'
import {
  canNavigateViewYearNext,
  canNavigateViewYearPrev,
  isYearMonthWithinInputBounds,
  parseYearMonth,
  toYearMonthValue,
} from './date-utils'
import styles from './pf-date-input.module.css'

const MONTH_LABELS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
] as const

export type PFDatePickerMonthPanelProps = {
  /** `YYYY-MM` */
  selectedMonth?: string | null
  initialViewYear?: number
  onSelectMonth?: (monthValue: string) => void
  className?: string
  id?: string
  'aria-label'?: string
}

export function PFDatePickerMonthPanel({
  selectedMonth = null,
  initialViewYear,
  onSelectMonth,
  className,
  id,
  'aria-label': ariaLabel = '연월 선택',
}: PFDatePickerMonthPanelProps) {
  const selected = selectedMonth ? parseYearMonth(selectedMonth) : null
  const [viewYear, setViewYear] = useState(
    () => initialViewYear ?? selected?.year ?? new Date().getFullYear()
  )

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
            aria-label="이전 해"
            disabled={!canNavigateViewYearPrev(viewYear)}
            onClick={() => setViewYear(prev => prev - 1)}
          />
          <p className={styles.yearMonth}>{viewYear}</p>
          <PFPageButton
            size="large"
            direction="right"
            aria-label="다음 해"
            disabled={!canNavigateViewYearNext(viewYear)}
            onClick={() => setViewYear(prev => prev + 1)}
          />
        </div>
        <div className={styles.headerRule} aria-hidden="true" />
      </div>

      <div className={styles.yearGrid}>
        {MONTH_LABELS.map((label, index) => {
          const month = index + 1
          const isDisabled = !isYearMonthWithinInputBounds(viewYear, month)
          const isSelected = selected?.year === viewYear && selected.month === month
          const monthClassName = [
            styles.yearCell,
            isDisabled ? styles.dayDisabled : undefined,
            isSelected ? styles.daySelected : undefined,
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={month}
              type="button"
              className={monthClassName}
              disabled={isDisabled}
              aria-label={`${viewYear}년 ${month}월`}
              aria-pressed={isSelected}
              onClick={() => {
                if (isDisabled) return
                onSelectMonth?.(toYearMonthValue(viewYear, month))
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
