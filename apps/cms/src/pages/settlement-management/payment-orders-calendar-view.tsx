/**
 * 정산 관리 > 지급조서 확인 — 캘린더 뷰
 * 레이아웃: participating-institutions-calendar-view.css + 공통 ProgramCalendar
 */

import { useCallback, useMemo, useState } from 'react'
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
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'
import { ProgramCalendar, type ProgramCalendarEventItem } from '@/shared/ui/program-calendar'
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

const STATUS_BORDER: Record<PaymentOrderAdminProcessingStatus, string> = {
  pending: 'rgba(56, 158, 13, 0.12)',
  confirmed: 'rgba(1, 161, 175, 0.12)',
  correction: 'rgba(207, 19, 34, 0.12)',
  rejected: 'rgba(0, 0, 0, 0.08)',
}

function formatWonPlus(amount: number): string {
  return `+${amount.toLocaleString('ko-KR')}원`
}

function formatCalendarAmount(status: PaymentOrderAdminProcessingStatus, amount: number): string {
  if (status === 'rejected') return '-'
  return formatWonPlus(amount)
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
  /** 지급 현황 상세 모달용 원본 목록 행 */
  sourceProgramRow?: PaymentOrderAdminProgramRow
  sourceInstructorRow?: PaymentOrderAdminInstructorRow
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
    sourceProgramRow: row,
  }))
}

function instructorDisplayTitle(name: string): string {
  const n = name.trim()
  return n ? `${n} 강사` : '강사'
}

function eventsFromInstructors(
  rows: PaymentOrderAdminInstructorRow[]
): PaymentOrderCalendarEvent[] {
  return rows.map(row => ({
    id: `instructor-${row.no}`,
    date: dayjs(row.referenceDate),
    exposure: 'instructor' as const,
    status: row.processingStatus,
    amount: row.estimatedAmount,
    bracketTitle: instructorDisplayTitle(row.instructorName),
    cardSubtitle: row.relatedProgramNames.join(', '),
    filterKey: row.instructorName,
    sourceInstructorRow: row,
  }))
}

function toProgramCalendarItems(events: PaymentOrderCalendarEvent[]): ProgramCalendarEventItem[] {
  return events.map(ev => ({
    id: ev.id,
    startDate: ev.date.format('YYYY-MM-DD'),
    endDate: ev.date.format('YYYY-MM-DD'),
    title: `${formatCalendarAmount(ev.status, ev.amount)} | ${CALENDAR_TAG_STATUS_SHORT[ev.status]}`,
    originalItem: ev,
  }))
}

function PaymentOrdersCalendarRightPanel({
  eventsForSelectedDate,
  onPaymentStatusDetailClick,
}: {
  eventsForSelectedDate: PaymentOrderCalendarEvent[]
  onPaymentStatusDetailClick?: (payload: PaymentOrdersCalendarDetailClick) => void
}) {
  const handleCardActivate = (ev: PaymentOrderCalendarEvent) => {
    if (!onPaymentStatusDetailClick) return
    if (ev.exposure === 'program' && ev.sourceProgramRow) {
      onPaymentStatusDetailClick({ exposure: 'program', row: ev.sourceProgramRow })
      return
    }
    if (ev.exposure === 'instructor' && ev.sourceInstructorRow) {
      onPaymentStatusDetailClick({ exposure: 'instructor', row: ev.sourceInstructorRow })
    }
  }

  return (
    <div className="payment-orders-calendar__calendar-right">
      <div className="payment-orders-calendar__calendar-right-cards">
        {eventsForSelectedDate.map(ev => {
          return (
            <div
              key={ev.id}
              role="button"
              tabIndex={0}
              className={`payment-orders-calendar__card payment-orders-calendar__card--${ev.status}`}
              onClick={() => handleCardActivate(ev)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCardActivate(ev)
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

export type PaymentOrdersCalendarDetailClick =
  | { exposure: 'program'; row: PaymentOrderAdminProgramRow }
  | { exposure: 'instructor'; row: PaymentOrderAdminInstructorRow }

export interface PaymentOrdersCalendarViewProps {
  exposure: PaymentOrdersCalendarExposure
  programRows: PaymentOrderAdminProgramRow[]
  instructorRows: PaymentOrderAdminInstructorRow[]
  /** 우측 목록 카드 클릭 시 지급 현황 상세(풀페이지 모달) */
  onPaymentStatusDetailClick?: (payload: PaymentOrdersCalendarDetailClick) => void
}

function resolvePaymentOrderEventColors(event: ProgramCalendarEventItem): ScheduleColorPair {
  const ev = event.originalItem as PaymentOrderCalendarEvent
  const status = ev.status
  return {
    ...SCHEDULE_COLORS[0],
    text: STATUS_TEXT_COLOR[status],
    bg: STATUS_BG[status],
    border: STATUS_BORDER[status],
  } as ScheduleColorPair
}

export function PaymentOrdersCalendarView({
  exposure,
  programRows,
  instructorRows,
  onPaymentStatusDetailClick,
}: PaymentOrdersCalendarViewProps) {
  const events = useMemo(
    () =>
      exposure === 'program'
        ? eventsFromPrograms(programRows)
        : eventsFromInstructors(instructorRows),
    [exposure, programRows, instructorRows]
  )

  const calendarItems = useMemo(() => toProgramCalendarItems(events), [events])

  const anchor = useMemo(
    () => pickAnchorDateForExposure(exposure, programRows, instructorRows),
    [exposure, programRows, instructorRows]
  )

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

  const renderEventsTooltipContent = useCallback(
    ({
      events: tooltipEvents,
    }: {
      events: ProgramCalendarEventItem[]
      colorMap: Map<string | number, ScheduleColorPair>
    }) => (
      <PaymentOrderDayTooltipContent
        items={tooltipEvents.map(e => e.originalItem as PaymentOrderCalendarEvent)}
      />
    ),
    []
  )

  const onTodayClick = useCallback(() => {
    const today = dayjs()
    setSelectedDate(today)
    if (calendarMode === 'week') {
      setCurrentMonth(today)
    } else {
      setCurrentMonth(today.startOf('month'))
    }
  }, [calendarMode])

  return (
    <div className="payment-orders-calendar-root">
      <div className="participating-institutions-calendar-layout">
        <div className="participating-institutions-calendar-card">
          <ProgramCalendar
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            mode={calendarMode}
            onSelectDate={onSelectDate}
            onMonthChange={onMonthChange}
            onModeChange={onModeChange}
            onTodayClick={onTodayClick}
            scheduleOverlay="tooltip"
            tooltipOverlayClassName="payment-orders-calendar-tooltip-overlay"
            events={calendarItems}
            resolveEventColors={resolvePaymentOrderEventColors}
            eventsTooltipScope="full-day"
            formatEventsOverflowText={n => `외 ${n}개의 항목`}
            renderEventsTooltipContent={renderEventsTooltipContent}
          />
        </div>
        <div className="participating-institutions-calendar-card participating-institutions-calendar-card--right payment-orders-calendar-card--right">
          <PaymentOrdersCalendarRightPanel
            key={`${exposure}-${selectedDate.format('YYYY-MM-DD')}`}
            eventsForSelectedDate={eventsForSelectedDate}
            onPaymentStatusDetailClick={onPaymentStatusDetailClick}
          />
        </div>
      </div>
    </div>
  )
}
