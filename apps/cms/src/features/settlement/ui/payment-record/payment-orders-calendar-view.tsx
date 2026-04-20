/**
 * 정산 관리 > 지급조서 확인 — 캘린더 뷰
 * 레이아웃: participating-institutions-calendar-view.css + 공통 ProgramCalendar
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { Checkbox } from 'antd'
import {
  PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import {
  PAYMENT_ORDER_STATUS_LIST_BG,
  PAYMENT_ORDER_STATUS_LIST_BORDER,
  PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR,
} from '@/shared/constants/payment-order-status-list-colors'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'
import type { ProgramCalendarEventItem } from '@/shared/components/program-calendar'
import { PaymentOrdersCalendarGrid } from './payment-orders-calendar-grid'
import '@/features/program/ui/detail-modal/program-status/participating-institutions-calendar-view.css'
import './payment-orders-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type PaymentOrdersCalendarExposure = 'program' | 'instructor'

/** 필터·mock 출강일 중 가장 이른 날 — 표시 월 앵커 */
function pickAnchorDateForExposure(
  exposure: PaymentOrdersCalendarExposure,
  programRows: PaymentOrderAdminProgramRow[],
  instructorRows: PaymentOrderAdminInstructorRow[]
): Dayjs {
  const rows = exposure === 'program' ? programRows : instructorRows
  if (rows.length === 0) return dayjs()
  let min: Dayjs | null = null
  for (const row of rows) {
    const dates =
      row.settlementRelevantAttendanceDates.length > 0
        ? row.settlementRelevantAttendanceDates
        : [row.referenceDate]
    for (const iso of dates) {
      const d = dayjs(iso)
      if (!d.isValid()) continue
      if (min == null || d.isBefore(min, 'day')) min = d
    }
  }
  return min ?? dayjs(rows[0].referenceDate)
}

function formatWonPlus(amount: number): string {
  return `+${amount.toLocaleString('ko-KR')}원`
}

function formatCalendarAmount(_status: PaymentOrderAdminProcessingStatus, amount: number): string {
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
  /** 주간 시간 격자: HH:mm (mock `calendarSlot*`에서 전달) */
  startTime?: string
  endTime?: string
  /** 주간 격자 태그 본문(줄바꿈). 없으면 bracketTitle 등 */
  weekGridLabel?: string
  /** 지급 현황 상세 모달용 원본 목록 행 */
  sourceProgramRow?: PaymentOrderAdminProgramRow
  sourceInstructorRow?: PaymentOrderAdminInstructorRow
}

function eventsFromPrograms(rows: PaymentOrderAdminProgramRow[]): PaymentOrderCalendarEvent[] {
  const out: PaymentOrderCalendarEvent[] = []
  for (const row of rows) {
    const dates =
      row.settlementRelevantAttendanceDates.length > 0
        ? row.settlementRelevantAttendanceDates
        : [row.referenceDate]
    for (const iso of dates) {
      out.push({
        id: `program-${row.no}-${iso}`,
        date: dayjs(iso),
        exposure: 'program' as const,
        status: row.processingStatus,
        amount: row.estimatedAmount,
        bracketTitle: row.programName,
        cardSubtitle: `정산 대상 강사 ${row.instructorCount}명`,
        filterKey: row.programName,
        sourceProgramRow: row,
      })
    }
  }
  return out
}

function instructorDisplayTitle(name: string): string {
  const n = name.trim()
  return n ? `${n} 강사` : '강사'
}

function eventsFromInstructors(
  rows: PaymentOrderAdminInstructorRow[]
): PaymentOrderCalendarEvent[] {
  const out: PaymentOrderCalendarEvent[] = []
  for (const row of rows) {
    const dates =
      row.settlementRelevantAttendanceDates.length > 0
        ? row.settlementRelevantAttendanceDates
        : [row.referenceDate]
    for (const iso of dates) {
      out.push({
        id: `instructor-${row.no}-${iso}`,
        date: dayjs(iso),
        exposure: 'instructor' as const,
        status: row.processingStatus,
        amount: row.estimatedAmount,
        bracketTitle: instructorDisplayTitle(row.instructorName),
        cardSubtitle: row.relatedProgramNames.join(', '),
        filterKey: row.instructorName,
        startTime: row.calendarSlotStartTime,
        endTime: row.calendarSlotEndTime,
        weekGridLabel: row.calendarWeekGridLabel,
        sourceInstructorRow: row,
      })
    }
  }
  return out
}

/** 주간 격자 태그 파스텔 표면(이벤트 id 기준으로 안정적으로 순환) */
const WEEK_GRID_PASTEL_SURFACES: Array<{ bg: string; border: string; text: string }> = [
  { bg: '#F0EEF9', border: '#E4DFF5', text: '#3d3d3d' },
  { bg: '#FFEDED', border: '#F5D9D9', text: '#3d3d3d' },
  { bg: '#EEF6FF', border: '#D9E8F5', text: '#3d3d3d' },
  { bg: '#F0FAF4', border: '#D5EBDD', text: '#3d3d3d' },
  { bg: '#FFF5EE', border: '#F0E0D4', text: '#3d3d3d' },
  { bg: '#F5F0FF', border: '#E8DFF5', text: '#3d3d3d' },
]

function hashWeekGridTone(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 100000
  return h
}

function weekGridSurfaceForPaymentEvent(id: string): { bg: string; border: string; text: string } {
  return WEEK_GRID_PASTEL_SURFACES[hashWeekGridTone(id) % WEEK_GRID_PASTEL_SURFACES.length]
}

function toProgramCalendarItems(events: PaymentOrderCalendarEvent[]): ProgramCalendarEventItem[] {
  return events.map(ev => ({
    id: ev.id,
    startDate: ev.date.format('YYYY-MM-DD'),
    endDate: ev.date.format('YYYY-MM-DD'),
    startTime: ev.startTime,
    endTime: ev.endTime,
    title: `${formatCalendarAmount(ev.status, ev.amount)} | ${PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST[ev.status]}`,
    timeGridLabel: ev.weekGridLabel ?? ev.bracketTitle,
    weekGridSurface: weekGridSurfaceForPaymentEvent(String(ev.id)),
    originalItem: ev,
  }))
}

function PaymentOrdersCalendarRightPanel({
  exposure,
  selectedDate,
  eventsForSelectedDate,
  onPaymentStatusDetailClick,
}: {
  exposure: PaymentOrdersCalendarExposure
  selectedDate: Dayjs
  eventsForSelectedDate: PaymentOrderCalendarEvent[]
  onPaymentStatusDetailClick?: (payload: PaymentOrdersCalendarDetailClick) => void
}) {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])

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

  const toggleSelected = (id: string) => {
    setSelectedCardIds(prev =>
      prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
    )
  }

  return (
    <div className="payment-orders-calendar__calendar-right">
      <div className="payment-orders-calendar__calendar-right-scroll">
        {exposure !== 'instructor' && (
          <div className="payment-orders-calendar__calendar-right-sticky-head">
            <span className="payment-orders-calendar__calendar-right-sticky-date">
              {selectedDate.format('YYYY.MM.DD')}
            </span>
            <span className="payment-orders-calendar__calendar-right-sticky-meta">
              {eventsForSelectedDate.length}건
            </span>
          </div>
        )}
        <div className="payment-orders-calendar__calendar-right-cards">
        {eventsForSelectedDate.map(ev => (
          // 카드 클릭은 상세 열기, 체크박스는 선택 상태만 관리
          <div
            key={ev.id}
            className={`payment-orders-calendar__card payment-orders-calendar__card--${ev.status} ${
              selectedCardIds.includes(ev.id) ? 'payment-orders-calendar__card--selected' : ''
            }`}
            style={{
              background: PAYMENT_ORDER_STATUS_LIST_BG[ev.status],
              borderColor: PAYMENT_ORDER_STATUS_LIST_BORDER[ev.status],
            }}
          >
            <div
              className="payment-orders-calendar__card-main"
              role="button"
              tabIndex={0}
              onClick={() => handleCardActivate(ev)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCardActivate(ev)
                }
              }}
            >
              <div className="payment-orders-calendar__card-content">
                <div className="payment-orders-calendar__card-title" title={ev.bracketTitle}>
                  {ev.bracketTitle}
                </div>
                <div className="payment-orders-calendar__card-status-row">
                  <span
                    className={`payment-orders-calendar__card-status payment-orders-calendar__card-status--${ev.status}`}
                    style={{ color: PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR[ev.status] }}
                  >
                    {PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST[ev.status]}
                  </span>
                  <span className="payment-orders-calendar__card-divider" aria-hidden />
                  <span className="payment-orders-calendar__card-amount">
                    {formatCalendarAmount(ev.status, ev.amount)}
                  </span>
                </div>
              </div>
              <div
                className="payment-orders-calendar__card-checkbox"
                onClick={e => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedCardIds.includes(ev.id)}
                  onChange={() => toggleSelected(ev.id)}
                />
              </div>
            </div>
          </div>
        ))}
        </div>
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
                style={{ color: PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR[ev.status] }}
              >
                {PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST[ev.status]}
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

/** 상단 기간 필터 `dateRangeOneMonthFromStart`와 동일: 해당 월 1일 ~ 다음달 전날 */
function oneMonthRangeMatchingFilter(month: Dayjs): [Dayjs, Dayjs] {
  const start = month.startOf('month')
  return [start, start.add(1, 'month').subtract(1, 'day')]
}

export interface PaymentOrdersCalendarViewProps {
  exposure: PaymentOrdersCalendarExposure
  programRows: PaymentOrderAdminProgramRow[]
  instructorRows: PaymentOrderAdminInstructorRow[]
  /** URL·조회에 적용된 기간(실제 출강일). 없으면 데이터 앵커 월을 표시 */
  filterDateRange: [Dayjs, Dayjs] | null
  /** 캘린더 헤더 네비·날짜 선택 시 기간 필터·URL과 동일하게 맞출 때 호출 */
  onFilterDateRangeApply?: (range: [Dayjs, Dayjs]) => void
  /** 우측 목록 카드 클릭 시 지급 현황 상세(풀페이지 모달) */
  onPaymentStatusDetailClick?: (payload: PaymentOrdersCalendarDetailClick) => void
}

function resolvePaymentOrderEventColors(event: ProgramCalendarEventItem): ScheduleColorPair {
  const ev = event.originalItem as PaymentOrderCalendarEvent
  const { status } = ev
  return {
    ...SCHEDULE_COLORS[0],
    text: PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR[status],
    bg: PAYMENT_ORDER_STATUS_LIST_BG[status],
    border: PAYMENT_ORDER_STATUS_LIST_BORDER[status],
  } as ScheduleColorPair
}

function filterEventsByDateRange<T extends { date: Dayjs }>(
  items: T[],
  range: [Dayjs, Dayjs] | null | undefined
): T[] {
  if (!range?.[0] || !range[1]) return items
  const [from, to] = range
  return items.filter(ev => !ev.date.isBefore(from, 'day') && !ev.date.isAfter(to, 'day'))
}

export function PaymentOrdersCalendarView({
  exposure,
  programRows,
  instructorRows,
  filterDateRange,
  onFilterDateRangeApply,
  onPaymentStatusDetailClick,
}: PaymentOrdersCalendarViewProps) {
  const events = useMemo(() => {
    const raw =
      exposure === 'program'
        ? eventsFromPrograms(programRows)
        : eventsFromInstructors(instructorRows)
    /** 프로그램·강사: 상단 기간 필터가 있으면 그 구간 안의 출강일만 캘린더에 표시 */
    return filterEventsByDateRange(raw, filterDateRange)
  }, [exposure, programRows, instructorRows, filterDateRange])

  const calendarItems = useMemo(() => toProgramCalendarItems(events), [events])

  const anchor = useMemo(
    () => pickAnchorDateForExposure(exposure, programRows, instructorRows),
    [exposure, programRows, instructorRows]
  )

  const viewMonth = useMemo(
    () => (filterDateRange?.[0] ? filterDateRange[0].startOf('month') : anchor.startOf('month')),
    [filterDateRange, anchor]
  )

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    const from = filterDateRange?.[0]
    const to = filterDateRange?.[1]
    if (from && to) return from
    return anchor
  })
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => viewMonth)

  useEffect(() => {
    setCurrentMonth(viewMonth)
  }, [viewMonth])

  useEffect(() => {
    setSelectedDate(prev => {
      const from = filterDateRange?.[0]
      const to = filterDateRange?.[1]
      if (from && to) {
        if (!prev.isBefore(from, 'day') && !prev.isAfter(to, 'day')) return prev
        return from
      }
      return anchor
    })
  }, [filterDateRange, anchor])
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')
  /** 프로그램·강사: 헤더에서 월간만 노출(주간 탭 숨김). `calendarMode`·주간 분기 로직은 유지 */
  const effectiveCalendarMode = exposure === 'program' ? ('month' as const) : calendarMode

  const eventsForSelectedDate = useMemo(
    () => events.filter(ev => selectedDate.isSame(ev.date, 'day')),
    [events, selectedDate]
  )

  const onSelectDate = useCallback(
    (date: Dayjs) => {
      setSelectedDate(date)
      if (effectiveCalendarMode === 'week') {
        setCurrentMonth(date)
        onFilterDateRangeApply?.(oneMonthRangeMatchingFilter(date))
      } else if (!date.isSame(currentMonth, 'month')) {
        setCurrentMonth(date.startOf('month'))
        onFilterDateRangeApply?.(oneMonthRangeMatchingFilter(date))
      }
    },
    [effectiveCalendarMode, currentMonth, onFilterDateRangeApply]
  )

  const onMonthChange = useCallback(
    (next: Dayjs) => {
      setCurrentMonth(next)
      onFilterDateRangeApply?.(oneMonthRangeMatchingFilter(next))
      if (effectiveCalendarMode === 'week') {
        setSelectedDate(prev => {
          const dow = prev.diff(prev.startOf('week'), 'day')
          return next.startOf('week').add(dow, 'day')
        })
      }
    },
    [effectiveCalendarMode, onFilterDateRangeApply]
  )

  const onModeChange = useCallback(
    (mode: 'month' | 'week') => {
      if (exposure === 'program') return
      setCalendarMode(mode)
      setSelectedDate(prev => {
        if (mode === 'week') {
          setCurrentMonth(prev)
        } else {
          setCurrentMonth(prev.startOf('month'))
        }
        return prev
      })
    },
    [exposure]
  )

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
    if (filterDateRange?.[0] && filterDateRange[1]) {
      const [from, to] = filterDateRange
      let d = today
      if (d.isBefore(from, 'day')) d = from
      else if (d.isAfter(to, 'day')) d = to
      setSelectedDate(d)
      setCurrentMonth(d.startOf('month'))
      onFilterDateRangeApply?.(oneMonthRangeMatchingFilter(d))
      return
    }
    setSelectedDate(today)
    if (effectiveCalendarMode === 'week') {
      setCurrentMonth(today)
    } else {
      setCurrentMonth(today.startOf('month'))
    }
    onFilterDateRangeApply?.(oneMonthRangeMatchingFilter(today))
  }, [filterDateRange, effectiveCalendarMode, onFilterDateRangeApply])

  return (
    <div
      className={[
        'payment-orders-calendar-root',
        exposure === 'instructor' ? 'payment-orders-calendar-root--instructor' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="participating-institutions-calendar-layout">
        <div className="participating-institutions-calendar-card">
          <PaymentOrdersCalendarGrid
            className="payment-orders-calendar__program-calendar"
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            mode={effectiveCalendarMode}
            onSelectDate={onSelectDate}
            onMonthChange={onMonthChange}
            onModeChange={onModeChange}
            onTodayClick={onTodayClick}
            weekViewVariant={exposure === 'instructor' ? 'time-grid' : 'simple'}
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
            exposure={exposure}
            selectedDate={selectedDate}
            eventsForSelectedDate={eventsForSelectedDate}
            onPaymentStatusDetailClick={onPaymentStatusDetailClick}
          />
        </div>
      </div>
    </div>
  )
}
