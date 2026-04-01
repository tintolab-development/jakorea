/**
 * 정산 관리 > 지급조서 확인 — 캘린더 뷰
 * 레이아웃·Ant Calendar 패턴: participating-institutions-calendar-view 재사용(CSS 클래스)
 */

import { useCallback, useMemo, useState } from 'react'
import { Calendar, Button, Tooltip } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
  PAYMENT_ORDER_ADMIN_STATUS_LABELS,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import '@/features/program/ui/detail-modal/program-status/participating-institutions-calendar-view.css'
import './payment-orders-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type PaymentOrdersCalendarExposure = 'program' | 'instructor'

/** 목록 mock의 referenceDate와 캘린더 표시 월이 어긋나지 않도록, 가장 이른 기준일(없으면 오늘) */
function pickAnchorDateForExposure(
  exposure: PaymentOrdersCalendarExposure,
  programRows: PaymentOrderAdminProgramRow[],
  instructorRows: PaymentOrderAdminInstructorRow[]
): Dayjs {
  const rows = exposure === 'program' ? programRows : instructorRows
  if (rows.length === 0) return dayjs()
  let min = dayjs(rows[0].referenceDate)
  for (let i = 1; i < rows.length; i++) {
    const d = dayjs(rows[i].referenceDate)
    if (d.isBefore(min, 'day')) min = d
  }
  return min
}

const CALENDAR_TAG_STATUS_SHORT: Record<PaymentOrderAdminProcessingStatus, string> = {
  pending: '제출·대기',
  confirmed: '확인 완료',
  correction: '정정 요청',
  rejected: '신청 반려',
}

const STATUS_TEXT_COLOR: Record<PaymentOrderAdminProcessingStatus, string> = {
  pending: '#389e0d',
  confirmed: '#01a1af',
  correction: '#cf1322',
  rejected: '#595959',
}

const STATUS_BG: Record<PaymentOrderAdminProcessingStatus, string> = {
  pending: '#f6ffed',
  confirmed: '#e6f7f9',
  correction: '#fff1f0',
  rejected: '#fafafa',
}

function formatWonPlus(amount: number): string {
  return `+${amount.toLocaleString('ko-KR')}원`
}

function formatCalendarAmount(status: PaymentOrderAdminProcessingStatus, amount: number): string {
  if (status === 'rejected') return '-'
  return formatWonPlus(amount)
}

function CalendarNavRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
      <path
        d="M5.58224 8.27543C5.45408 8.08135 5.47583 7.81739 5.64669 7.64652L9.64669 3.64652C9.84196 3.45126 10.1585 3.45126 10.3537 3.64652C10.549 3.84179 10.549 4.15829 10.3537 4.35356L6.70724 8.00004L10.3537 11.6465C10.549 11.8418 10.549 12.1583 10.3537 12.3536C10.1585 12.5488 9.84195 12.5488 9.64669 12.3536L5.64669 8.35355L5.58224 8.27543Z"
        fill="#3D3D3D"
        stroke="#3D3D3D"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarNavLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      className="participating-institutions-calendar-nav-icon--left"
    >
      <path
        d="M5.58224 8.27543C5.45408 8.08135 5.47583 7.81739 5.64669 7.64652L9.64669 3.64652C9.84196 3.45126 10.1585 3.45126 10.3537 3.64652C10.549 3.84179 10.549 4.15829 10.3537 4.35356L6.70724 8.00004L10.3537 11.6465C10.549 11.8418 10.549 12.1583 10.3537 12.3536C10.1585 12.5488 9.84195 12.5488 9.64669 12.3536L5.64669 8.35355L5.58224 8.27543Z"
        fill="#3D3D3D"
        stroke="#3D3D3D"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface PaymentOrderCalendarEvent {
  id: string
  date: Dayjs
  exposure: PaymentOrdersCalendarExposure
  status: PaymentOrderAdminProcessingStatus
  amount: number
  /** 툴팁·카드 2번째 줄: 프로그램명 또는 강사별 「이름 강사」 */
  bracketTitle: string
  /** 카드 하단 보조 설명 */
  cardSubtitle: string
  /** 멀티셀렉트 필터 값 */
  filterKey: string
}

function eventsFromPrograms(rows: PaymentOrderAdminProgramRow[]): PaymentOrderCalendarEvent[] {
  return rows.map(row => ({
    id: `program-${row.no}`,
    date: dayjs(row.referenceDate),
    exposure: 'program' as const,
    status: row.processingStatus,
    amount: row.estimatedAmount,
    bracketTitle: row.programName,
    cardSubtitle: `정산 대상 강사 ${row.instructorCount}명`,
    filterKey: row.programName,
  }))
}

function instructorDisplayTitle(name: string): string {
  const n = name.trim()
  return n ? `${n} 강사` : '강사'
}

function eventsFromInstructors(rows: PaymentOrderAdminInstructorRow[]): PaymentOrderCalendarEvent[] {
  return rows.map(row => ({
    id: `instructor-${row.no}`,
    date: dayjs(row.referenceDate),
    exposure: 'instructor' as const,
    status: row.processingStatus,
    amount: row.estimatedAmount,
    bracketTitle: instructorDisplayTitle(row.instructorName),
    cardSubtitle: row.relatedProgramNames.join(', '),
    filterKey: row.instructorName,
  }))
}

function PaymentOrdersCalendarRightPanel({
  eventsForSelectedDate,
}: {
  eventsForSelectedDate: PaymentOrderCalendarEvent[]
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const toggleCardSelection = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="payment-orders-calendar__calendar-right">
      <div className="payment-orders-calendar__calendar-right-cards">
        {eventsForSelectedDate.map(ev => {
          const isSelected = selectedId !== null && ev.id === selectedId
          return (
            <div
              key={ev.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              className={`payment-orders-calendar__card payment-orders-calendar__card--${ev.status}${isSelected ? ' payment-orders-calendar__card--selected' : ''}`}
              onClick={() => toggleCardSelection(ev.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleCardSelection(ev.id)
                }
              }}
            >
              <div className="payment-orders-calendar__card-status-row">
                <span
                  className="payment-orders-calendar__card-status"
                  style={{ color: STATUS_TEXT_COLOR[ev.status] }}
                >
                  {PAYMENT_ORDER_ADMIN_STATUS_LABELS[ev.status]}
                </span>
                <span className="payment-orders-calendar__card-divider" aria-hidden />
                <span className="payment-orders-calendar__card-amount">
                  {formatCalendarAmount(ev.status, ev.amount)}
                </span>
              </div>
              <div className="payment-orders-calendar__card-program" title={ev.bracketTitle}>
                {ev.bracketTitle}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PaymentOrderDayTooltipContent({ items }: { items: PaymentOrderCalendarEvent[] }) {
  return (
    <div className="payment-orders-calendar-tag-preview">
      {items.map(ev => {
        const isInstructor = ev.exposure === 'instructor'
        const headline = isInstructor ? ev.bracketTitle : `[${ev.bracketTitle}]`
        return (
          <div key={ev.id} className="payment-orders-calendar-tag-preview__block">
            <span className="payment-orders-calendar-tag-preview__title" title={headline}>
              {headline}
            </span>
            <div className="payment-orders-calendar-tag-preview__row2">
              <span
                className="payment-orders-calendar-tag-preview__status"
                style={{ color: STATUS_TEXT_COLOR[ev.status] }}
              >
                {PAYMENT_ORDER_ADMIN_STATUS_LABELS[ev.status]}
              </span>
              <span className="payment-orders-calendar-tag-preview__sep" aria-hidden>
                |
              </span>
              <span className="payment-orders-calendar-tag-preview__amount">
                {formatCalendarAmount(ev.status, ev.amount)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface PaymentOrdersCalendarViewProps {
  exposure: PaymentOrdersCalendarExposure
  programRows: PaymentOrderAdminProgramRow[]
  instructorRows: PaymentOrderAdminInstructorRow[]
}

export function PaymentOrdersCalendarView({
  exposure,
  programRows,
  instructorRows,
}: PaymentOrdersCalendarViewProps) {
  const events = useMemo(
    () =>
      exposure === 'program' ? eventsFromPrograms(programRows) : eventsFromInstructors(instructorRows),
    [exposure, programRows, instructorRows]
  )

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() =>
    pickAnchorDateForExposure(exposure, programRows, instructorRows)
  )
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() =>
    pickAnchorDateForExposure(exposure, programRows, instructorRows).startOf('month')
  )
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')

  const getEventsForDate = useCallback(
    (date: Dayjs) => events.filter(ev => date.isSame(ev.date, 'day')),
    [events]
  )

  const eventsForSelectedDate = useMemo(
    () => events.filter(ev => selectedDate.isSame(ev.date, 'day')),
    [events, selectedDate]
  )

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
  }

  /** 주간: selectedDate 기준 주 + 동일 목데이터(getEventsForDate). 이전/다음 주 이동 시 월 패널도 맞춤 */
  const handlePrev = useCallback(() => {
    if (calendarMode === 'week') {
      const next = selectedDate.subtract(1, 'week')
      setSelectedDate(next)
      setCurrentMonth(next.startOf('month'))
    } else {
      setCurrentMonth(prev => prev.subtract(1, 'month'))
    }
  }, [calendarMode, selectedDate])

  const handleNext = useCallback(() => {
    if (calendarMode === 'week') {
      const next = selectedDate.add(1, 'week')
      setSelectedDate(next)
      setCurrentMonth(next.startOf('month'))
    } else {
      setCurrentMonth(prev => prev.add(1, 'month'))
    }
  }, [calendarMode, selectedDate])

  const handleToday = useCallback(() => {
    const today = dayjs()
    setSelectedDate(today)
    setCurrentMonth(today.startOf('month'))
  }, [])

  const weekDates = useMemo(() => {
    const startOfWeek = selectedDate.startOf('week')
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  }, [selectedDate])

  const renderDayTooltip = (dayEvents: PaymentOrderCalendarEvent[]) => (
    <PaymentOrderDayTooltipContent items={dayEvents} />
  )

  const renderEventTag = (ev: PaymentOrderCalendarEvent, stopCellClick?: boolean) => {
    const statusColor = STATUS_TEXT_COLOR[ev.status]
    const dayEvents = getEventsForDate(ev.date)
    return (
      <Tooltip
        key={ev.id}
        title={renderDayTooltip(dayEvents)}
        placement="topLeft"
        mouseEnterDelay={0.2}
        overlayClassName="payment-orders-calendar-tooltip-overlay"
      >
        <div
          className="payment-orders-calendar-event-tag"
          style={{ backgroundColor: STATUS_BG[ev.status] }}
          onClick={stopCellClick ? e => e.stopPropagation() : undefined}
          role="presentation"
        >
          <span className="payment-orders-calendar-event-tag__body">
            <span className="payment-orders-calendar-event-tag__amount" style={{ color: statusColor }}>
              {formatCalendarAmount(ev.status, ev.amount)}
            </span>
            <span className="payment-orders-calendar-event-tag__sep" style={{ color: statusColor }} aria-hidden>
              |
            </span>
            <span
              className="payment-orders-calendar-event-tag__status"
              style={{ color: statusColor }}
            >
              {CALENDAR_TAG_STATUS_SHORT[ev.status]}
            </span>
          </span>
        </div>
      </Tooltip>
    )
  }

  const headerRender = () => {
    const headerTitle =
      calendarMode === 'week'
        ? `${weekDates[0].format('YYYY.MM')} ${weekDates[0].format('D')} - ${weekDates[6].format('D')}`
        : currentMonth.format('YYYY. MM')

    return (
      <div className="participating-institutions-calendar-header">
        <div className="participating-institutions-calendar-header-left">
          <span className="participating-institutions-calendar-header-title">{headerTitle}</span>
          <Button size="small" className="participating-institutions-calendar-today-btn" onClick={handleToday}>
            오늘
          </Button>
          <div className="participating-institutions-calendar-nav">
            <Button
              type="text"
              size="small"
              icon={<CalendarNavRightIcon />}
              className="participating-institutions-calendar-nav-btn"
              onClick={handlePrev}
            />
            <Button
              type="text"
              size="small"
              icon={<CalendarNavLeftIcon />}
              className="participating-institutions-calendar-nav-btn"
              onClick={handleNext}
            />
          </div>
        </div>
        <div className="participating-institutions-calendar-header-right">
          <div className="participating-institutions-calendar-view-mode">
            <div
              className={`participating-institutions-calendar-view-mode__indicator ${calendarMode === 'week' ? 'participating-institutions-calendar-view-mode__indicator--week' : ''}`}
              aria-hidden
            />
            <button
              type="button"
              className={`participating-institutions-calendar-view-mode__tab ${calendarMode === 'month' ? 'participating-institutions-calendar-view-mode__tab--active' : ''}`}
              onClick={() => {
                setCalendarMode('month')
                setCurrentMonth(selectedDate.startOf('month'))
              }}
            >
              <span className="participating-institutions-calendar-view-mode__tab-text">월간</span>
            </button>
            <button
              type="button"
              className={`participating-institutions-calendar-view-mode__tab ${calendarMode === 'week' ? 'participating-institutions-calendar-view-mode__tab--active' : ''}`}
              onClick={() => {
                setCalendarMode('week')
                setCurrentMonth(selectedDate.startOf('month'))
              }}
            >
              <span className="participating-institutions-calendar-view-mode__tab-text">주간</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const dateFullCellRender = (date: Dayjs) => {
    const isCurrentMonth = date.isSame(currentMonth, 'month')
    const isToday = date.isSame(dayjs(), 'day')
    const isSelected = date.isSame(selectedDate, 'day')
    const dayEvents = getEventsForDate(date)
    const hasEvents = dayEvents.length > 0

    return (
      <div
        className={`participating-institutions-calendar-cell ${!isCurrentMonth ? 'participating-institutions-calendar-cell--other-month' : ''} ${isSelected ? 'participating-institutions-calendar-cell--selected' : ''} ${isToday ? 'participating-institutions-calendar-cell--today' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        <div className="participating-institutions-calendar-cell-date">
          <span className={isToday ? 'participating-institutions-calendar-cell-date-today' : ''}>
            {date.date()}
          </span>
        </div>
        {hasEvents && (
          <div className="participating-institutions-calendar-cell-events">
            {dayEvents.slice(0, 2).map(ev => renderEventTag(ev, true))}
            {dayEvents.length > 2 && (
              <Tooltip
                title={renderDayTooltip(dayEvents)}
                placement="topLeft"
                mouseEnterDelay={0.2}
                overlayClassName="payment-orders-calendar-tooltip-overlay"
              >
                <div className="participating-institutions-calendar-event-more">
                  외 {dayEvents.length - 2}개의 항목
                </div>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className="participating-institutions-calendar-week">
        <div className="participating-institutions-calendar-week-header">
          {weekdayNames.map(day => (
            <div key={day} className="participating-institutions-calendar-week-header-cell">
              {day}
            </div>
          ))}
        </div>
        <div className="participating-institutions-calendar-week-body">
          {weekDates.map(d => {
            const isToday = d.isSame(dayjs(), 'day')
            const isSelected = d.isSame(selectedDate, 'day')
            const dayEvents = getEventsForDate(d)
            const hasEvents = dayEvents.length > 0
            return (
              <div
                key={d.format('YYYY-MM-DD')}
                className={`participating-institutions-calendar-week-cell ${isSelected ? 'participating-institutions-calendar-week-cell--selected' : ''} ${isToday ? 'participating-institutions-calendar-week-cell--today' : ''}`}
                onClick={() => handleDateSelect(d)}
              >
                <div className="participating-institutions-calendar-week-cell-date">{d.date()}</div>
                {hasEvents && (
                  <div className="participating-institutions-calendar-week-cell-events">
                    {dayEvents.slice(0, 2).map(ev => renderEventTag(ev, true))}
                    {dayEvents.length > 2 && (
                      <Tooltip
                        title={renderDayTooltip(dayEvents)}
                        placement="topLeft"
                        mouseEnterDelay={0.2}
                        overlayClassName="payment-orders-calendar-tooltip-overlay"
                      >
                        <div className="participating-institutions-calendar-event-more">
                          외 {dayEvents.length - 2}개의 항목
                        </div>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="payment-orders-calendar-root">
      <div className="participating-institutions-calendar-layout">
        <div className="participating-institutions-calendar-card participating-institutions-calendar-card--left">
          {headerRender()}
          {calendarMode === 'week' ? (
            renderWeekView()
          ) : (
            <Calendar value={currentMonth} fullCellRender={dateFullCellRender} headerRender={() => null} />
          )}
        </div>
        <div className="participating-institutions-calendar-card participating-institutions-calendar-card--right payment-orders-calendar-card--right">
          <PaymentOrdersCalendarRightPanel
            key={`${exposure}-${selectedDate.format('YYYY-MM-DD')}`}
            eventsForSelectedDate={eventsForSelectedDate}
          />
        </div>
      </div>
    </div>
  )
}
