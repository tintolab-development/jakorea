/**
 * 정산 관리 > 계좌 지급 확인 — 캘린더 뷰
 * 좌측 그리드: shared/components/calendar `CalendarMain`(이벤트 모드)
 * 레이아웃·우측 패널: payment-record/payment-orders-calendar-view.css 재사용
 */

import { useCallback, useMemo, useState } from 'react'
import { Checkbox } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  ACCOUNT_PAYMENT_STATUS_LABELS,
  type AccountPaymentRow,
  type AccountPaymentTransferStatus,
} from '@/data/mock/account-payments-list'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'
import { CalendarMain, type CalendarItem } from '@/shared/components/calendar'
import '@/shared/components/calendar/styles/calendar.css'
import '@/features/program/ui/detail-modal/program-status/participating-institutions-calendar-view.css'
import '@/features/settlement/ui/payment-record/payment-orders-calendar-view.css'
import './account-payments-calendar-view.css'

const STATUS_TEXT_COLOR: Record<AccountPaymentTransferStatus, string> = {
  pending: '#F07917',
  completed: '#017eaf',
}

const STATUS_BG: Record<AccountPaymentTransferStatus, string> = {
  pending: 'rgba(240, 121, 23, 0.06)',
  completed: '#F2F8F2',
}

const STATUS_BORDER: Record<AccountPaymentTransferStatus, string> = {
  pending: 'rgba(240, 121, 23, 0.12)',
  completed: 'rgba(1, 126, 175, 0.12)',
}

const TAG_SHORT: Record<AccountPaymentTransferStatus, string> = {
  pending: '확인 대기',
  completed: '계좌 지급',
}

function formatWonPlus(amount: number): string {
  return `+${amount.toLocaleString('ko-KR')}원`
}

function pickAnchorDate(rows: AccountPaymentRow[]): Dayjs {
  if (rows.length === 0) return dayjs()
  let min = dayjs(rows[0].transferScheduledDate)
  for (let i = 1; i < rows.length; i++) {
    const d = dayjs(rows[i].transferScheduledDate)
    if (d.isBefore(min, 'day')) min = d
  }
  return min
}

export interface AccountPaymentCalendarEvent {
  id: string
  date: Dayjs
  status: AccountPaymentTransferStatus
  amount: number
  programTitle: string
  instructorLine: string
}

/** `mapEventsToItems` 입력 행 — `CalendarItem.original`에 그대로 보관 */
type AccountCalendarEventSourceRow = {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: AccountPaymentCalendarEvent
}

function eventsFromRows(rows: AccountPaymentRow[]): AccountPaymentCalendarEvent[] {
  return rows.map(row => ({
    id: row.id,
    date: dayjs(row.transferScheduledDate),
    status: row.accountPaymentStatus,
    amount: row.amount,
    programTitle: row.programName,
    instructorLine: `${row.instructorName} · ${row.institutionName}`,
  }))
}

function toCalendarMainEvents(events: AccountPaymentCalendarEvent[]): AccountCalendarEventSourceRow[] {
  return events.map(ev => {
    const d = ev.date.format('YYYY-MM-DD')
    return {
      id: ev.id,
      startDate: d,
      endDate: d,
      title: `${formatWonPlus(ev.amount)} | ${TAG_SHORT[ev.status]}`,
      originalItem: ev,
    }
  })
}

function accountEventFromCalendarItem(item: CalendarItem): AccountPaymentCalendarEvent | undefined {
  const row = item.original as AccountCalendarEventSourceRow | undefined
  return row?.originalItem
}

function calendarItemsToAccountEvents(items: CalendarItem[]): AccountPaymentCalendarEvent[] {
  const out: AccountPaymentCalendarEvent[] = []
  for (const item of items) {
    const ev = accountEventFromCalendarItem(item)
    if (ev) out.push(ev)
  }
  return out
}

function resolveAccountPaymentEventColors(item: CalendarItem): ScheduleColorPair {
  const ev = accountEventFromCalendarItem(item)
  if (!ev) return SCHEDULE_COLORS[0] as ScheduleColorPair
  const { status } = ev
  return {
    ...SCHEDULE_COLORS[0],
    text: STATUS_TEXT_COLOR[status],
    bg: STATUS_BG[status],
    border: STATUS_BORDER[status],
  } as ScheduleColorPair
}

function AccountPaymentsCalendarRightPanel({
  eventsForSelectedDate,
}: {
  eventsForSelectedDate: AccountPaymentCalendarEvent[]
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
          const cardMod =
            ev.status === 'completed'
              ? 'account-payments-calendar__card--account-completed'
              : 'account-payments-calendar__card--account-pending'
          return (
            <div
              key={ev.id}
              style={{ background: STATUS_BG[ev.status] }}
              className={`payment-orders-calendar__card ${cardMod}${isSelected ? ' payment-orders-calendar__card--selected' : ''}`}
            >
              <div
                className="payment-orders-calendar__card-main"
                role="button"
                tabIndex={0}
                onClick={() => toggleCardSelection(ev.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleCardSelection(ev.id)
                  }
                }}
              >
                <div className="payment-orders-calendar__card-content">
                  <div className="payment-orders-calendar__card-title" title={ev.programTitle}>
                    {ev.programTitle}
                  </div>
                  <div className="payment-orders-calendar__card-status-row">
                    <span
                      className={`payment-orders-calendar__card-status payment-orders-calendar__card-status--${ev.status}`}
                      style={{ color: STATUS_TEXT_COLOR[ev.status] }}
                    >
                      {ACCOUNT_PAYMENT_STATUS_LABELS[ev.status]}
                    </span>
                    <span className="payment-orders-calendar__card-divider" aria-hidden />
                    <span className="payment-orders-calendar__card-amount">
                      {formatWonPlus(ev.amount)}
                    </span>
                  </div>
                </div>
                <div
                  className="payment-orders-calendar__card-checkbox"
                  onClick={e => e.stopPropagation()}
                >
                  <Checkbox checked={isSelected} onChange={() => toggleCardSelection(ev.id)} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AccountPaymentDayTooltipContent({ items }: { items: AccountPaymentCalendarEvent[] }) {
  return (
    <div className="payment-orders-calendar-tag-preview">
      {items.map(ev => (
        <div key={ev.id} className="payment-orders-calendar-tag-preview__block">
          <span className="payment-orders-calendar-tag-preview__title" title={ev.programTitle}>
            {ev.programTitle}
          </span>
          <div className="payment-orders-calendar-tag-preview__row2">
            <span
              className="payment-orders-calendar-tag-preview__status"
              style={{ color: STATUS_TEXT_COLOR[ev.status] }}
            >
              {ACCOUNT_PAYMENT_STATUS_LABELS[ev.status]}
            </span>
            <span className="payment-orders-calendar-tag-preview__sep" aria-hidden>
              |
            </span>
            <span className="payment-orders-calendar-tag-preview__amount">
              {formatWonPlus(ev.amount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface AccountPaymentsCalendarViewProps {
  rows: AccountPaymentRow[]
}

export function AccountPaymentsCalendarView({ rows }: AccountPaymentsCalendarViewProps) {
  const events = useMemo(() => eventsFromRows(rows), [rows])
  const calendarEvents = useMemo(() => toCalendarMainEvents(events), [events])

  const anchor = useMemo(() => pickAnchorDate(rows), [rows])

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => anchor)
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => anchor.startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')

  const eventsForSelectedDate = useMemo(
    () => events.filter(ev => selectedDate.isSame(ev.date, 'day')),
    [events, selectedDate]
  )

  const onSelectDate = useCallback(
    (date: Dayjs) => {
      setSelectedDate(date)
      if (calendarMode === 'week') {
        setCurrentMonth(date)
      } else if (!date.isSame(currentMonth, 'month')) {
        setCurrentMonth(date.startOf('month'))
      }
    },
    [calendarMode, currentMonth]
  )

  const onMonthChange = useCallback(
    (next: Dayjs) => {
      setCurrentMonth(next)
      if (calendarMode === 'week') {
        setSelectedDate(prev => {
          const dow = prev.diff(prev.startOf('week'), 'day')
          return next.startOf('week').add(dow, 'day')
        })
      }
    },
    [calendarMode]
  )

  const onModeChange = useCallback((mode: 'month' | 'week') => {
    setCalendarMode(mode)
    setSelectedDate(prev => {
      if (mode === 'week') {
        setCurrentMonth(prev)
      } else {
        setCurrentMonth(prev.startOf('month'))
      }
      return prev
    })
  }, [])

  const onTodayClick = useCallback(() => {
    const today = dayjs()
    setSelectedDate(today)
    if (calendarMode === 'week') {
      setCurrentMonth(today)
    } else {
      setCurrentMonth(today.startOf('month'))
    }
  }, [calendarMode])

  const previewTooltipContent = useCallback(
    (args: { events: CalendarItem[]; colorMap: Map<string | number, ScheduleColorPair> }) => (
      <AccountPaymentDayTooltipContent items={calendarItemsToAccountEvents(args.events)} />
    ),
    []
  )

  return (
    <div className="payment-orders-calendar-root">
      <div className="participating-institutions-calendar-layout">
        <div className="participating-institutions-calendar-card participating-institutions-calendar-card--left">
          <CalendarMain
            className="payment-orders-calendar__account-calendar calendar-main"
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            mode={calendarMode}
            onSelectDate={onSelectDate}
            onMonthChange={onMonthChange}
            onModeChange={onModeChange}
            onTodayClick={onTodayClick}
            tooltipOverlayClassName="payment-orders-calendar-tooltip-overlay"
            events={calendarEvents}
            resolveEventColors={resolveAccountPaymentEventColors}
            eventsTooltipScope="full-day"
            formatEventsOverflowText={n => `외 ${n}개의 항목`}
            previewTooltipContent={previewTooltipContent}
          />
        </div>
        <div className="participating-institutions-calendar-card participating-institutions-calendar-card--right payment-orders-calendar-card--right">
          <AccountPaymentsCalendarRightPanel
            key={selectedDate.format('YYYY-MM-DD')}
            eventsForSelectedDate={eventsForSelectedDate}
          />
        </div>
      </div>
    </div>
  )
}
