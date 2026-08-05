import { useMemo, useState } from 'react'
import { PFButton } from '@/shared/ui/pf-button'
import { PFPageButton } from '@/shared/ui/pf-page-button'
import { PFText } from '@/shared/ui/pf-text'
import { CALENDAR_EVENT_COLORS } from './calendar-event-colors'
import { buildCalendarWeekLayouts, type PFCalendarEvent } from './calendar-events'
import { CALENDAR_LEGEND_ITEMS } from './calendar-legend'
import {
  addMonths,
  formatYearMonth,
  getMonthGridDays,
  isSameDay,
  startOfDay,
} from './calendar-month'
import styles from './pf-calendar.module.css'

const WEEKDAYS = [
  { key: 'sun', label: 'Sun', className: styles.weekdaySun },
  { key: 'mon', label: 'Mon', className: styles.weekdayDefault },
  { key: 'tue', label: 'Tue', className: styles.weekdayDefault },
  { key: 'wed', label: 'Wed', className: styles.weekdayDefault },
  { key: 'thu', label: 'Thu', className: styles.weekdayDefault },
  { key: 'fri', label: 'Fri', className: styles.weekdayDefault },
  { key: 'sat', label: 'Sat', className: styles.weekdaySat },
] as const

export type { PFCalendarEvent }

export type PFCalendarProps = {
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date) => void
  month?: Date
  defaultMonth?: Date
  onMonthChange?: (month: Date) => void
  events?: PFCalendarEvent[]
  className?: string
  showLegend?: boolean
}

function toMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function PFCalendar({
  value,
  defaultValue,
  onChange,
  month,
  defaultMonth,
  onMonthChange,
  events = [],
  className,
  showLegend = true,
}: PFCalendarProps) {
  const today = startOfDay(new Date())
  const [uncontrolledSelected, setUncontrolledSelected] = useState(() =>
    startOfDay(defaultValue ?? today),
  )
  const [uncontrolledMonth, setUncontrolledMonth] = useState(() =>
    toMonthStart(defaultMonth ?? defaultValue ?? today),
  )

  const selectedDate = value ? startOfDay(value) : uncontrolledSelected
  const viewMonth = month ? toMonthStart(month) : uncontrolledMonth

  const weekLayouts = useMemo(() => {
    const days = getMonthGridDays(viewMonth)
    return buildCalendarWeekLayouts(days, events)
  }, [viewMonth, events])

  const setSelectedDate = (next: Date) => {
    const nextDay = startOfDay(next)
    if (value === undefined) {
      setUncontrolledSelected(nextDay)
    }
    onChange?.(nextDay)
  }

  const setViewMonth = (next: Date) => {
    const nextMonth = toMonthStart(next)
    if (month === undefined) {
      setUncontrolledMonth(nextMonth)
    }
    onMonthChange?.(nextMonth)
  }

  const handleToday = () => {
    setSelectedDate(today)
    setViewMonth(today)
  }

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date)
    const nextMonth = toMonthStart(date)
    if (
      viewMonth.getFullYear() !== nextMonth.getFullYear() ||
      viewMonth.getMonth() !== nextMonth.getMonth()
    ) {
      setViewMonth(nextMonth)
    }
  }

  const rootClassName = [styles.calendar, className].filter(Boolean).join(' ')

  return (
    <section className={rootClassName} aria-label="캘린더">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <PFText as="h2" typo="hd-sm" color="black" className={styles.yearMonth}>
            {formatYearMonth(viewMonth)}
          </PFText>
          <PFButton
            variant="tertiary"
            size="small"
            className={styles.todayButton}
            onClick={handleToday}
          >
            오늘
          </PFButton>
          <div className={styles.navGroup}>
            <PFPageButton
              size="large"
              direction="left"
              aria-label="이전 달"
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
            />
            <PFPageButton
              size="large"
              direction="right"
              aria-label="다음 달"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            />
          </div>
        </div>

        {showLegend ? (
          <div className={styles.legend} aria-label="일정 범례">
            {CALENDAR_LEGEND_ITEMS.map(item => (
              <div key={item.key} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <PFText as="span" typo="caption-sb" className={styles.legendLabel}>
                  {item.label}
                </PFText>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map(weekday => (
          <PFText
            key={weekday.key}
            as="span"
            typo="bd-md-md"
            className={[styles.weekday, weekday.className].join(' ')}
          >
            {weekday.label}
          </PFText>
        ))}
      </div>

      <div className={styles.weeks} role="grid" aria-label={`${formatYearMonth(viewMonth)} 날짜`}>
        {weekLayouts.map(week => {
          const weekKey = `${week.days[0].date.getFullYear()}-${week.days[0].date.getMonth()}-${week.days[0].date.getDate()}`

          return (
            <div key={weekKey} className={styles.week}>
              <div className={styles.weekDays}>
                {week.days.map((day, col) => {
                  const selected = isSameDay(day.date, selectedDate)
                  const dayToneClass = !day.isCurrentMonth
                    ? styles.dayOutside
                    : day.weekday === 0
                      ? styles.daySun
                      : day.weekday === 6
                        ? styles.daySat
                        : styles.dayCurrent
                  const overflow = week.overflowByCol[col]

                  return (
                    <button
                      key={`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`}
                      type="button"
                      className={[styles.cell, !day.isCurrentMonth ? styles.cellOutside : undefined]
                        .filter(Boolean)
                        .join(' ')}
                      aria-label={`${day.date.getFullYear()}년 ${day.date.getMonth() + 1}월 ${day.day}일`}
                      aria-pressed={selected}
                      onClick={() => handleSelectDay(day.date)}
                    >
                      <span
                        className={[
                          styles.dayText,
                          'typo-bd-md-md',
                          dayToneClass,
                          selected ? styles.daySelected : undefined,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {day.day}
                      </span>
                      {overflow > 0 ? (
                        <span className={styles.overflowLabel}>외 {overflow}개</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {week.segments.length > 0 ? (
                <div className={styles.eventLayer} aria-hidden="true">
                  {week.segments.map(segment => {
                    const colors = CALENDAR_EVENT_COLORS[segment.type]
                    return (
                      <div
                        key={`${segment.eventId}-${segment.startCol}-${segment.lane}`}
                        className={[
                          styles.eventBar,
                          segment.isRangeStart ? styles.eventBarStart : undefined,
                          segment.isRangeEnd ? styles.eventBarEnd : undefined,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        style={{
                          gridColumn: `${segment.startCol + 1} / ${segment.endCol + 2}`,
                          gridRow: segment.lane + 1,
                          backgroundColor: colors.background,
                          borderLeftColor: segment.isRangeStart ? colors.accent : 'transparent',
                        }}
                        onClick={event => {
                          const rect = event.currentTarget.getBoundingClientRect()
                          const ratio = (event.clientX - rect.left) / Math.max(rect.width, 1)
                          const span = segment.endCol - segment.startCol + 1
                          const colOffset = Math.min(span - 1, Math.max(0, Math.floor(ratio * span)))
                          handleSelectDay(week.days[segment.startCol + colOffset].date)
                        }}
                      >
                        <span className={styles.eventBarText}>{segment.label}</span>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
