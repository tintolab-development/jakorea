import { useState } from 'react'
import {
  addMonths,
  formatYearMonth,
  getMonthGridDays,
  isSameDay,
  type CalendarDay,
} from '../pf-calendar/calendar-month'
import { PFPageButton } from '../pf-page-button'
import {
  canNavigateViewMonth,
  chunkWeeks,
  clampViewMonth,
  isDateWithinInputBounds,
  parseIsoDate,
  toIsoDate,
  type DateRangeValue,
} from './date-utils'
import styles from './pf-date-input.module.css'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

export type PFDatePickerCalendarProps = {
  selectionMode?: 'single' | 'range'
  /** single 모드 선택일 `YYYY-MM-DD` */
  selectedDate?: string | null
  /** range 모드 선택 구간 */
  range?: DateRangeValue
  initialViewMonth?: Date
  onSelectDate?: (isoDate: string) => void
  onSelectRange?: (range: { start: string; end: string }) => void
  /** 점으로 강조할 날짜 `YYYY-MM-DD` (예: 선택 가능한 일정이 있는 날) */
  markedDates?: ReadonlySet<string>
  /** 지정 시 이 집합의 날짜 `YYYY-MM-DD`만 클릭 가능, 나머지는 비활성 */
  enabledDates?: ReadonlySet<string>
  /**
   * 선택 가능 최소일 `YYYY-MM-DD` (inclusive).
   * `null`/`undefined`면 제한하지 않는다. 빈 문자열로 바꾸지 말 것.
   */
  minDate?: string | null
  /**
   * 선택 가능 최대일 `YYYY-MM-DD` (inclusive).
   * `null`/`undefined`면 제한하지 않는다. 빈 문자열로 바꾸지 말 것.
   */
  maxDate?: string | null
  /** true면 팝오버 그림자 없이 본문에 인라인 배치 (`role="group"`) */
  inline?: boolean
  /**
   * 신청 양식 일정 선택 — 연한/진한 민트 일자 (모바일은 추가로 300px 미니 레이아웃)
   * @deprecated `miniview`는 `applySchedule`와 동일
   */
  variant?: 'default' | 'applySchedule' | 'miniview'
  className?: string
  id?: string
  'aria-label'?: string
}

function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function resolveRangeBounds(range: DateRangeValue | undefined): {
  start: string | null
  end: string | null
} {
  if (!range?.start) return { start: null, end: null }
  if (!range.end) return { start: range.start, end: null }
  return compareIso(range.start, range.end) <= 0
    ? { start: range.start, end: range.end }
    : { start: range.end, end: range.start }
}

function resolveSelectableBoundIso(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return parseIsoDate(trimmed) ? trimmed : null
}

export function PFDatePickerCalendar({
  selectionMode = 'single',
  selectedDate = null,
  range,
  initialViewMonth,
  onSelectDate,
  onSelectRange,
  markedDates,
  enabledDates,
  minDate = null,
  maxDate = null,
  inline = false,
  variant = 'default',
  className,
  id,
  'aria-label': ariaLabel = '날짜 선택',
}: PFDatePickerCalendarProps) {
  const selected = selectedDate ? parseIsoDate(selectedDate) : null
  const bounds = resolveRangeBounds(range)
  const selectableMin = resolveSelectableBoundIso(minDate)
  const selectableMax = resolveSelectableBoundIso(maxDate)
  const anchorDate =
    selected ??
    (bounds.start ? parseIsoDate(bounds.start) : null) ??
    (selectableMin ? parseIsoDate(selectableMin) : null) ??
    new Date()

  const [viewMonth, setViewMonth] = useState(() =>
    clampViewMonth(
      initialViewMonth ?? new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
    )
  )
  const [draftStart, setDraftStart] = useState<string | null>(
    selectionMode === 'range' ? bounds.start : null
  )
  const [draftEnd, setDraftEnd] = useState<string | null>(
    selectionMode === 'range' ? bounds.end : null
  )

  const weeks = chunkWeeks(getMonthGridDays(viewMonth))
  const activeStart = selectionMode === 'range' ? draftStart : selectedDate
  const activeEnd = selectionMode === 'range' ? draftEnd : selectedDate
  const hasCompleteRange =
    selectionMode === 'range' && activeStart != null && activeEnd != null

  const isDayDisabled = (date: Date) => {
    if (!isDateWithinInputBounds(date)) return true
    const iso = toIsoDate(date)
    if (selectableMin != null && iso < selectableMin) return true
    if (selectableMax != null && iso > selectableMax) return true
    if (enabledDates != null && !enabledDates.has(iso)) return true
    return false
  }

  const handleSelectDay = (day: CalendarDay) => {
    if (isDayDisabled(day.date)) return

    const iso = toIsoDate(day.date)
    setViewMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1))

    if (selectionMode === 'single') {
      onSelectDate?.(iso)
      return
    }

    // range: 미완성(시작만)이면 종료 지정, 완료·없음이면 새 시작
    if (draftStart && !draftEnd) {
      const start = draftStart <= iso ? draftStart : iso
      const end = draftStart <= iso ? iso : draftStart
      setDraftStart(start)
      setDraftEnd(end)
      onSelectRange?.({ start, end })
      return
    }

    setDraftStart(iso)
    setDraftEnd(null)
  }

  return (
    <div
      id={id}
      className={[
        styles.popover,
        inline ? styles.popoverInline : undefined,
        variant === 'default'
          ? undefined
          : styles.popoverApplySchedule,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={inline ? 'group' : 'dialog'}
      aria-label={ariaLabel}
    >
      <div className={styles.header}>
        <PFPageButton
          size="large"
          direction="left"
          aria-label="이전 달"
          disabled={!canNavigateViewMonth(viewMonth, -1)}
          onClick={() => setViewMonth(prev => clampViewMonth(addMonths(prev, -1)))}
        />
        <p className={styles.yearMonth}>{formatYearMonth(viewMonth)}</p>
        <PFPageButton
          size="large"
          direction="right"
          aria-label="다음 달"
          disabled={!canNavigateViewMonth(viewMonth, 1)}
          onClick={() => setViewMonth(prev => clampViewMonth(addMonths(prev, 1)))}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.weekdayRow} aria-hidden="true">
          {WEEKDAYS.map(weekday => (
            <span key={weekday} className={styles.weekday}>
              {weekday}
            </span>
          ))}
        </div>

        <div className={styles.weeks}>
          {weeks.map(week => {
            const weekKey = toIsoDate(week[0].date)
            return (
              <div className={styles.week} key={weekKey}>
                {week.map((day, dayIndex) => {
                  const iso = toIsoDate(day.date)
                  const isDisabled = isDayDisabled(day.date)
                  const isSunday = day.weekday === 0
                  const isSaturday = day.weekday === 6

                  let inRange = false
                  let isRangeStart = false
                  let isRangeEnd = false
                  let isSelected = false

                  if (selectionMode === 'single') {
                    isSelected = selected != null && isSameDay(day.date, selected)
                  } else if (activeStart) {
                    if (activeEnd) {
                      inRange = iso > activeStart && iso < activeEnd
                      isRangeStart = iso === activeStart
                      isRangeEnd = iso === activeEnd
                      isSelected = isRangeStart || isRangeEnd
                    } else {
                      isSelected = iso === activeStart
                      isRangeStart = isSelected
                    }
                  }

                  const inSelection =
                    hasCompleteRange &&
                    activeStart != null &&
                    activeEnd != null &&
                    iso >= activeStart &&
                    iso <= activeEnd
                  const prevIso =
                    dayIndex > 0 ? toIsoDate(week[dayIndex - 1].date) : null
                  const nextIso =
                    dayIndex < 6 ? toIsoDate(week[dayIndex + 1].date) : null
                  const prevInSelection =
                    prevIso != null &&
                    activeStart != null &&
                    activeEnd != null &&
                    prevIso >= activeStart &&
                    prevIso <= activeEnd
                  const nextInSelection =
                    nextIso != null &&
                    activeStart != null &&
                    activeEnd != null &&
                    nextIso >= activeStart &&
                    nextIso <= activeEnd

                  const dayClassName = [
                    styles.day,
                    isDisabled ? styles.dayDisabled : undefined,
                    !day.isCurrentMonth ? styles.dayOutside : undefined,
                    day.isCurrentMonth && isSunday && !isRangeStart && !isRangeEnd && !inRange
                      ? styles.daySunday
                      : undefined,
                    day.isCurrentMonth && isSaturday && !isRangeStart && !isRangeEnd && !inRange
                      ? styles.daySaturday
                      : undefined,
                    inRange ? styles.dayInRange : undefined,
                    isRangeStart ? styles.dayRangeStart : undefined,
                    isRangeEnd ? styles.dayRangeEnd : undefined,
                    inSelection && nextInSelection ? styles.dayBridgeRight : undefined,
                    inSelection && prevInSelection ? styles.dayBridgeLeft : undefined,
                    selectionMode === 'single' && isSelected ? styles.daySelected : undefined,
                    day.isCurrentMonth && markedDates?.has(iso) ? styles.dayMarked : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <button
                      key={iso}
                      type="button"
                      className={dayClassName}
                      disabled={isDisabled}
                      aria-label={`${day.date.getFullYear()}년 ${day.date.getMonth() + 1}월 ${day.day}일`}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectDay(day)}
                    >
                      {day.day}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
