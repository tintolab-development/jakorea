import { useMemo, useState } from 'react'
import {
  getMypageScheduleEventsOnDate,
  syncSelectedDateToMonth,
  type MypageScheduleEvent,
} from '@/features/mypage'
import { CALENDAR_EVENT_COLORS, PFCalendar, PFText, type PFCalendarEvent } from '@/shared/ui'
import styles from './schedule-section.module.css'

/** mock 일정 데모용 초기 월(실 API 세션은 오늘 기준) */
const MOCK_DEMO_MONTH = new Date(2026, 0, 1)
const MOCK_DEMO_SELECTED = new Date(2026, 0, 3)

function toCalendarEvents(events: MypageScheduleEvent[]): PFCalendarEvent[] {
  return events.map(event => ({
    id: event.id,
    programName: event.programName,
    title: event.title,
    time: event.time,
    type: event.type,
    startDate: event.startDate,
    endDate: event.endDate,
  }))
}

function toMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function toDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

type ScheduleSectionProps = {
  events?: readonly MypageScheduleEvent[]
  /** true면 mock 데모 월(2026-01)로 시작 — API 세션에서는 false */
  useMockDemoMonth?: boolean
}

export function ScheduleSection({
  events = [],
  useMockDemoMonth = false,
}: ScheduleSectionProps) {
  const [selectedDate, setSelectedDate] = useState(() =>
    useMockDemoMonth ? MOCK_DEMO_SELECTED : toDayStart(new Date()),
  )
  const [viewMonth, setViewMonth] = useState(() =>
    useMockDemoMonth ? MOCK_DEMO_MONTH : toMonthStart(new Date()),
  )

  const scheduleEvents = useMemo(() => [...events], [events])

  const calendarEvents = useMemo(() => toCalendarEvents(scheduleEvents), [scheduleEvents])

  const selectedEvents = useMemo(
    () => getMypageScheduleEventsOnDate(scheduleEvents, selectedDate),
    [scheduleEvents, selectedDate],
  )

  const handleDateChange = (nextDate: Date) => {
    setSelectedDate(nextDate)
    setViewMonth(toMonthStart(nextDate))
  }

  /** 월 이동 시 선택일을 보이는 달로 맞춤 → 우측 목록과 캘린더가 같은 날짜 기준 */
  const handleMonthChange = (nextMonth: Date) => {
    const monthStart = toMonthStart(nextMonth)
    setViewMonth(monthStart)
    setSelectedDate(prev => syncSelectedDateToMonth(monthStart, prev, scheduleEvents))
  }

  return (
    <div className={styles.section}>
      <PFCalendar
        className={styles.calendar}
        value={selectedDate}
        month={viewMonth}
        events={calendarEvents}
        onChange={handleDateChange}
        onMonthChange={handleMonthChange}
      />
      <aside className={styles.listSlot} aria-label="일정 목록">
        {selectedEvents.length > 0 ? (
          <div className={styles.list}>
            <div className={styles.listHeader}>
              <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600" className={styles.listLead}>
                확인이 필요한 일정이에요
              </PFText>
              <PFText as="h3" typo="hd-sm" color="black" className={styles.listCount}>
                총 {selectedEvents.length}개
              </PFText>
            </div>
            <ul className={styles.listItems}>
              {selectedEvents.map(event => {
                const colors = CALENDAR_EVENT_COLORS[event.type]
                return (
                  <li
                    key={event.id}
                    className={styles.listItem}
                    style={{ borderLeftColor: colors.accent }}
                  >
                    <PFText
                      as="p"
                      typo="bd-sm-rg"
                      color="neutral-cool-500"
                      className={styles.listProgram}
                    >
                      {event.programName}
                    </PFText>
                    <div className={styles.listDetail}>
                      <PFText as="p" typo="bd-lg-sb" color="black" className={styles.listTitle}>
                        {event.title}
                      </PFText>
                      <PFText as="p" typo="bd-md-rg" color="black" className={styles.listTime}>
                        {event.time}
                      </PFText>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <div className={styles.empty}>
            <PFText as="p" typo="bd-md-bd" color="black" className={styles.emptyTitle}>
              예정된 프로그램 일정이 없어요
            </PFText>
            <PFText
              as="p"
              typo="bd-sm-rg"
              color="neutral-cool-500"
              className={styles.emptyDescription}
            >
              신청한 프로그램 일정이 생기면
              <br />
              캘린더에서 확인할 수 있어요.
            </PFText>
          </div>
        )}
      </aside>
    </div>
  )
}
