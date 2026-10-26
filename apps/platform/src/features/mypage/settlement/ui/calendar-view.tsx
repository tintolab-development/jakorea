import { useMemo } from 'react'
import { PFButton, PFEmptyState, PFPageButton, PFText } from '@/shared/ui'
import { buildCalendarWeekLayouts, type PFCalendarEvent } from '@/shared/ui/pf-calendar/calendar-events'
import { getMonthGridDays, isSameDay, startOfDay } from '@/shared/ui/pf-calendar/calendar-month'
import calendarStyles from '@/shared/ui/pf-calendar/pf-calendar.module.css'
import { formatSignedWonAmount } from '../lib/format-amount'
import { formatCalendarMonthLabel, formatDateKey, isoDateKey, parseDateKey, parseMonthKey } from '../lib/date-keys'
import {
  SETTLEMENT_CALENDAR_EVENT_COLORS,
  SETTLEMENT_CALENDAR_LEGEND_ORDER,
  SETTLEMENT_STATUS_CALENDAR_SHORT,
} from '../lib/status-presentation'
import type { SettlementOverviewItem } from '../model/types'
import styles from './calendar-view.module.css'

const WEEKDAYS = [
  { key: 'sun', label: 'Sun', className: calendarStyles.weekdaySun },
  { key: 'mon', label: 'Mon', className: calendarStyles.weekdayDefault },
  { key: 'tue', label: 'Tue', className: calendarStyles.weekdayDefault },
  { key: 'wed', label: 'Wed', className: calendarStyles.weekdayDefault },
  { key: 'thu', label: 'Thu', className: calendarStyles.weekdayDefault },
  { key: 'fri', label: 'Fri', className: calendarStyles.weekdayDefault },
  { key: 'sat', label: 'Sat', className: calendarStyles.weekdaySat },
] as const

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

type SettlementCalendarViewProps = {
  month: string
  date: string
  items: SettlementOverviewItem[]
  onMonthChange: (month: string, date: string) => void
  onDateChange: (date: string) => void
}

function toEvents(items: SettlementOverviewItem[]): PFCalendarEvent[] {
  return items.map(item => ({
    id: item.id,
    programName: '',
    title: formatSignedWonAmount(item.appliedAmount),
    type: item.status,
    startDate: isoDateKey(item.startsAt),
    endDate: isoDateKey(item.endsAt) || isoDateKey(item.startsAt),
  }))
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function SettlementCalendarView({
  month,
  date,
  items,
  onMonthChange,
  onDateChange,
}: SettlementCalendarViewProps) {
  const viewMonth = useMemo(() => parseMonthKey(month) ?? new Date(), [month])
  const selectedDate = useMemo(
    () => startOfDay(parseDateKey(date) ?? viewMonth),
    [date, viewMonth],
  )
  const events = useMemo(() => toEvents(items), [items])
  const weekLayouts = useMemo(() => {
    const days = getMonthGridDays(viewMonth)
    return buildCalendarWeekLayouts(days, events)
  }, [events, viewMonth])

  const selectedItems = useMemo(() => {
    const selectedKey = formatDateKey(selectedDate)
    return items.filter(item => {
      const start = isoDateKey(item.startsAt)
      const end = isoDateKey(item.endsAt) || start
      return start <= selectedKey && selectedKey <= end
    })
  }, [items, selectedDate])

  const handleSelectDay = (next: Date) => {
    onDateChange(formatDateKey(startOfDay(next)))
  }

  const handleShiftMonth = (amount: number) => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + amount, 1)
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    const nextDate = `${nextMonth}-01`
    onMonthChange(nextMonth, nextDate)
  }

  const handleToday = () => {
    const today = startOfDay(new Date())
    onMonthChange(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      formatDateKey(today),
    )
  }

  return (
    <div className={styles.layout}>
      <section className={[calendarStyles.calendar, styles.calendar].join(' ')}>
        <div className={calendarStyles.header}>
          <div className={calendarStyles.headerLeft}>
            <div className={calendarStyles.navGroup}>
              <PFPageButton
                direction="left"
                size="small"
                aria-label="이전 월"
                onClick={() => handleShiftMonth(-1)}
              />
              <PFText as="h2" typo="hd-sm" color="black" className={calendarStyles.yearMonth}>
                {formatCalendarMonthLabel(month)}
              </PFText>
              <PFPageButton
                direction="right"
                size="small"
                aria-label="다음 월"
                onClick={() => handleShiftMonth(1)}
              />
            </div>
            <PFButton
              type="button"
              variant="tertiary"
              size="small"
              className={calendarStyles.todayButton}
              onClick={handleToday}
            >
              오늘
            </PFButton>
          </div>
          <ul className={[calendarStyles.legend, styles.legend].join(' ')}>
            {SETTLEMENT_CALENDAR_LEGEND_ORDER.map(status => (
              <li key={status} className={calendarStyles.legendItem}>
                <span
                  className={calendarStyles.legendDot}
                  style={{ backgroundColor: SETTLEMENT_CALENDAR_EVENT_COLORS[status].accent }}
                />
                <PFText as="span" typo="caption-rg" className={calendarStyles.legendLabel}>
                  {SETTLEMENT_STATUS_CALENDAR_SHORT[status]}
                </PFText>
              </li>
            ))}
          </ul>
        </div>

        <div className={calendarStyles.weekdays} aria-hidden="true">
          {WEEKDAYS.map(weekday => (
            <PFText
              key={weekday.key}
              as="span"
              typo="bd-md-md"
              className={[calendarStyles.weekday, weekday.className].join(' ')}
            >
              {weekday.label}
            </PFText>
          ))}
        </div>

        <div className={calendarStyles.weeks} role="grid" aria-label={`${formatCalendarMonthLabel(month)} 정산 일정`}>
          {weekLayouts.map(week => {
            const weekKey = toDateKey(week.days[0].date)
            return (
              <div key={weekKey} className={calendarStyles.week}>
                <div className={calendarStyles.weekDays}>
                  {week.days.map((day, col) => {
                    const selected = isSameDay(day.date, selectedDate)
                    const overflow = week.overflowByCol[col]
                    const dayToneClass = !day.isCurrentMonth
                      ? calendarStyles.dayOutside
                      : day.weekday === 0
                        ? calendarStyles.daySun
                        : day.weekday === 6
                          ? calendarStyles.daySat
                          : calendarStyles.dayCurrent

                    return (
                      <div key={toDateKey(day.date)} className={calendarStyles.cellHost}>
                        <button
                          type="button"
                          className={[
                            calendarStyles.cell,
                            !day.isCurrentMonth ? calendarStyles.cellOutside : undefined,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-label={`${day.date.getFullYear()}년 ${day.date.getMonth() + 1}월 ${day.day}일`}
                          aria-pressed={selected}
                          onClick={() => handleSelectDay(day.date)}
                        >
                          <span
                            className={[
                              calendarStyles.dayText,
                              'typo-bd-md-md',
                              dayToneClass,
                              selected ? calendarStyles.daySelected : undefined,
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {day.day}
                          </span>
                          {overflow > 0 ? (
                            <span className={calendarStyles.overflowLabel}>외 {overflow}개</span>
                          ) : null}
                        </button>
                      </div>
                    )
                  })}
                </div>
                {week.segments.length > 0 ? (
                  <div className={calendarStyles.eventLayer} aria-hidden="true">
                    {week.segments.map(segment => {
                      const colors = SETTLEMENT_CALENDAR_EVENT_COLORS[
                        segment.type as keyof typeof SETTLEMENT_CALENDAR_EVENT_COLORS
                      ]
                      return (
                        <div
                          key={`${segment.eventId}-${segment.startCol}-${segment.lane}`}
                          className={calendarStyles.eventBar}
                          style={{
                            gridColumn: `${segment.startCol + 1} / ${segment.endCol + 2}`,
                            gridRow: segment.lane + 1,
                            backgroundColor: colors?.background,
                            borderLeftColor: segment.isRangeStart
                              ? colors?.accent
                              : 'transparent',
                          }}
                        >
                          <span className={calendarStyles.eventBarTitle}>{segment.title}</span>
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

      <aside className={styles.side} aria-label="선택일 정산 일정">
        <div className={styles.sideHeader}>
          <PFText as="p" typo="hd-md" color="black" className={styles.sideDay}>
            {String(selectedDate.getDate()).padStart(2, '0')}
          </PFText>
          <PFText as="p" typo="bd-md-md" color="neutral-cool-500" className={styles.sideWeekday}>
            {WEEKDAY_KO[selectedDate.getDay()]}
          </PFText>
        </div>
        {selectedItems.length === 0 ? (
          <PFEmptyState
            variant="inline"
            title="선택한 날짜에 정산 일정이 없어요"
            description={
              <>
                정산 일정이 생기면
                <br />
                캘린더에서 확인할 수 있어요.
              </>
            }
          />
        ) : (
          <ul className={styles.sideList}>
            {selectedItems.map(item => {
              const colors = SETTLEMENT_CALENDAR_EVENT_COLORS[item.status]
              return (
                <li key={item.id} className={styles.sideItem}>
                  <span className={styles.sideStatus} style={{ backgroundColor: colors.background }}>
                    <span className={styles.sideStatusDot} style={{ backgroundColor: colors.accent }} />
                    <PFText as="span" typo="caption-sb" color="black">
                      {SETTLEMENT_STATUS_CALENDAR_SHORT[item.status]}
                    </PFText>
                  </span>
                  <PFText as="p" typo="bd-md-sb" color="black" className={styles.sideProgram}>
                    {item.programName}
                  </PFText>
                  <PFText as="p" typo="bd-md-md" color="black" className={styles.sideAmount}>
                    {formatSignedWonAmount(item.appliedAmount)}
                  </PFText>
                </li>
              )
            })}
          </ul>
        )}
      </aside>
    </div>
  )
}
