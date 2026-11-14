import { useMemo, type CSSProperties } from 'react'
import type { Dayjs } from 'dayjs'
import { ButtonLeftIcon, ButtonRightIcon } from '@/shared/ui/icons'
import {
  buildMiniCalendarGridDays,
  countMiniCalendarWeekRows,
  miniCalendarWeekdayLabels,
} from '../lib/calendar-mini-layout'
import '../styles/calendar.css'

interface CalendarMiniProps {
  currentMonth: Dayjs
  selectedDate: Dayjs
  onMonthChange: (month: Dayjs) => void
  onSelectDate: (date: Dayjs) => void
  programDates: Set<string>
  /** 구간 선택 UI — 지정 시 해당 구간 셀에 범위 전용 클래스(스타일은 소비측 CSS) */
  rangeSelection?: { start: Dayjs; end: Dayjs } | null
  /**
   * true면 선택 강조는 `programDates`만 사용(다중 선택 모달). false면 `selectedDate` 포커스 링도 표시.
   */
  multiSelectHighlight?: boolean
  /**
   * 비활성 날짜 판정 — true면 셀에 `calendar-mini-cell--disabled` + 클릭 차단.
   */
  disabledDate?: (date: Dayjs) => boolean
}

function renderCalendarMiniCell(
  date: Dayjs,
  currentMonth: Dayjs,
  selectedDate: Dayjs,
  programDates: Set<string>,
  rangeSelection: { start: Dayjs; end: Dayjs } | null,
  disabledDate: ((date: Dayjs) => boolean) | undefined,
  onSelectDate: (date: Dayjs) => void,
  multiSelectHighlight: boolean
) {
  const isCurrentMonth = date.isSame(currentMonth, 'month')
  const hasSchedule = isCurrentMonth && programDates.has(date.format('YYYY-MM-DD'))
  const dayOfWeek = date.day()
  const weekendClass =
    dayOfWeek === 0 ? 'calendar-mini-cell--sunday' : dayOfWeek === 6 ? 'calendar-mini-cell--saturday' : ''

  if (rangeSelection != null) {
    const a = rangeSelection.start
    const b = rangeSelection.end
    const s = a.isBefore(b) || a.isSame(b, 'day') ? a : b
    const e = a.isBefore(b) || a.isSame(b, 'day') ? b : a
    const inRange = !date.isBefore(s, 'day') && !date.isAfter(e, 'day')
    if (inRange) {
      const isStart = date.isSame(s, 'day')
      const isEnd = date.isSame(e, 'day')
      const rangeClass = isStart && isEnd
        ? 'calendar-mini-cell--range-single'
        : isStart
          ? 'calendar-mini-cell--range-start'
          : isEnd
            ? 'calendar-mini-cell--range-end'
            : 'calendar-mini-cell--range-middle'
      const isDisabled = !isCurrentMonth || (disabledDate?.(date) ?? false)
      const activateDate = () => {
        if (!isCurrentMonth) return
        if (isDisabled) return
        onSelectDate(date)
      }
      return (
        <button
          type="button"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : 0}
          className={[
            'calendar-mini-cell',
            !isCurrentMonth ? 'calendar-mini-cell--other-month' : '',
            hasSchedule ? 'calendar-mini-cell--has-schedule' : '',
            isDisabled ? 'calendar-mini-cell--disabled' : '',
            weekendClass,
            rangeClass,
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            activateDate()
          }}
        >
          <span className="calendar-mini-date">{date.date()}</span>
        </button>
      )
    }
  }

  const isFocusDay = isCurrentMonth && date.isSame(selectedDate, 'day')
  const isSelected = multiSelectHighlight ? hasSchedule : isFocusDay
  const isDisabled = !isCurrentMonth || (disabledDate?.(date) ?? false)

  const activateDate = () => {
    if (!isCurrentMonth) return
    if (isDisabled) return
    onSelectDate(date)
  }

  return (
    <button
      type="button"
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      className={[
        'calendar-mini-cell',
        !isCurrentMonth ? 'calendar-mini-cell--other-month' : '',
        hasSchedule ? 'calendar-mini-cell--has-schedule' : '',
        isSelected ? 'calendar-mini-cell--selected' : '',
        isDisabled ? 'calendar-mini-cell--disabled' : '',
        weekendClass,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={event => {
        event.preventDefault()
        event.stopPropagation()
        activateDate()
      }}
    >
      <span className="calendar-mini-date">{date.date()}</span>
    </button>
  )
}

export function CalendarMini({
  currentMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
  programDates,
  rangeSelection = null,
  multiSelectHighlight = false,
  disabledDate,
}: CalendarMiniProps) {
  const handlePrevMonth = () => {
    onMonthChange(currentMonth.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    onMonthChange(currentMonth.add(1, 'month'))
  }

  const weekRows = useMemo(() => countMiniCalendarWeekRows(currentMonth), [currentMonth])
  const gridDays = useMemo(() => buildMiniCalendarGridDays(currentMonth), [currentMonth])
  const weekdayLabels = miniCalendarWeekdayLabels()

  const miniStyle = {
    '--calendar-mini-week-rows': weekRows,
  } as CSSProperties

  const weeks = useMemo(() => {
    const rows: Dayjs[][] = []
    for (let row = 0; row < weekRows; row += 1) {
      rows.push(gridDays.slice(row * 7, row * 7 + 7))
    }
    return rows
  }, [gridDays, weekRows])

  return (
    <div className="calendar-mini" style={miniStyle} data-week-rows={weekRows}>
      <div className="calendar-mini-header">
        <button type="button" className="calendar-mini-nav-btn" onClick={handlePrevMonth}>
          <ButtonLeftIcon className="calendar-mini-nav-icon" />
        </button>
        <span className="calendar-mini-title">{currentMonth.format('YYYY. MM')}</span>
        <button type="button" className="calendar-mini-nav-btn" onClick={handleNextMonth}>
          <ButtonRightIcon className="calendar-mini-nav-icon" />
        </button>
      </div>
      <div className="calendar-mini-grid" aria-label="달력">
        <table className="calendar-mini-grid-table">
          <thead>
            <tr>
              {weekdayLabels.map(label => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map(date => (
                  <td
                    key={date.format('YYYY-MM-DD')}
                    className="calendar-mini-grid-cell"
                    onClick={event => {
                      if ((event.target as HTMLElement).closest('button.calendar-mini-cell')) return
                      const isOtherMonth = !date.isSame(currentMonth, 'month')
                      const cellDisabled =
                        isOtherMonth || (disabledDate?.(date) ?? false)
                      if (cellDisabled) return
                      event.preventDefault()
                      event.stopPropagation()
                      onSelectDate(date)
                    }}
                  >
                    {renderCalendarMiniCell(
                      date,
                      currentMonth,
                      selectedDate,
                      programDates,
                      rangeSelection,
                      disabledDate,
                      onSelectDate,
                      multiSelectHighlight
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
