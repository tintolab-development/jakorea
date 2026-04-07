/**
 * 정산 관리 > 지급조서 확인 — 캘린더 뷰
 * 레이아웃: participating-institutions-calendar-view.css + 공통 ProgramCalendar
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Checkbox } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
  PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST,
  PAYMENT_ORDER_STATUS_LABELS_LIST,
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
    title: `${formatCalendarAmount(ev.status, ev.amount)} | ${PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST[ev.status]}`,
    originalItem: ev,
  }))
}

function PaymentOrdersCalendarRightPanel({
  eventsForSelectedDate,
  selectedRowKeys,
  onSelectionChange,
  onPaymentStatusDetailClick,
}: {
  eventsForSelectedDate: PaymentOrderCalendarEvent[]
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
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

  const handleToggleSelection = (id: Key) => {
    if (selectedRowKeys.includes(id)) {
      onSelectionChange(selectedRowKeys.filter(k => k !== id))
    } else {
      onSelectionChange([...selectedRowKeys, id])
    }
  }

  return (
    <div className="payment-orders-calendar__calendar-right">
      <div className="payment-orders-calendar__calendar-right-cards">
        {eventsForSelectedDate.map(ev => {
          const isChecked = selectedRowKeys.includes(ev.id)
          return (
            <div
              key={ev.id}
              style={{
                border: `1px solid ${PAYMENT_ORDER_STATUS_LIST_BORDER[ev.status]}`,
                background: PAYMENT_ORDER_STATUS_LIST_BG[ev.status],
              }}
              className={`payment-orders-calendar__card${isChecked ? ' payment-orders-calendar__card--selected' : ''}`}
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
                <div className="payment-orders-calendar__card-status-row">
                  <span
                    className="payment-orders-calendar__card-status"
                    style={{ color: PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR[ev.status] }}
                  >
                    {PAYMENT_ORDER_STATUS_LABELS_LIST[ev.status]}
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
              <div
                className="applicant-schedule-item-checkbox"
                onClick={e => {
                  e.stopPropagation()
                  handleToggleSelection(ev.id)
                }}
              >
                <Checkbox checked={isChecked} />
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
                style={{ color: PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR[ev.status] }}
              >
                {PAYMENT_ORDER_STATUS_LABELS_LIST[ev.status]}
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
  /**
   * 우측 패널 체크 선택 — 둘 다 주면 제어 컴포넌트(일괄 확인 등 상위 연동).
   * 미주입 시 내부 상태만 사용.
   */
  rightPanelSelectedKeys?: Key[]
  onRightPanelSelectedKeysChange?: (keys: Key[]) => void
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

export function PaymentOrdersCalendarView({
  exposure,
  programRows,
  instructorRows,
  onPaymentStatusDetailClick,
  rightPanelSelectedKeys: controlledRightPanelKeys,
  onRightPanelSelectedKeysChange,
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
  const [internalRightPanelKeys, setInternalRightPanelKeys] = useState<Key[]>([])
  const isRightPanelControlled =
    controlledRightPanelKeys !== undefined && onRightPanelSelectedKeysChange !== undefined
  const rightPanelSelectedKeys = isRightPanelControlled
    ? controlledRightPanelKeys!
    : internalRightPanelKeys
  const setRightPanelSelectedKeys = isRightPanelControlled
    ? onRightPanelSelectedKeysChange!
    : setInternalRightPanelKeys

  useEffect(() => {
    setRightPanelSelectedKeys([])
  }, [selectedDate, exposure, setRightPanelSelectedKeys])

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
            selectedRowKeys={rightPanelSelectedKeys}
            onSelectionChange={setRightPanelSelectedKeys}
            onPaymentStatusDetailClick={onPaymentStatusDetailClick}
          />
        </div>
      </div>
    </div>
  )
}
