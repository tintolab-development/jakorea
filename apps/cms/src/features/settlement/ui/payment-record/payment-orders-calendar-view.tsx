/**
 * 정산 관리 > 지급조서 확인 — 캘린더 뷰
 * CalendarMain(이벤트 모드) + CalendarSubRightSettlementList, 공통 정산 툴팁/리스트 UI
 * 프로그램별·강사별 모두 **월간**만 (주간 토글 없음).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import { getPaymentOrdersMonthFilterRange } from '@/pages/settlement-management/payment-orders-date-range'
import {
  settlementCalendarPrimaryTitle,
  type InstructorSettlementInvoiceDetail,
  type InstructorSettlementListRow,
  type InstructorSettlementUiStatus,
} from '@/data/mock/instructor-member-settlements'
import {
  CalendarMain,
  CalendarSubRightSettlementList,
  settlementRowFromCalendarItem,
  settlementEventStatusColorPair,
  type CalendarItem,
} from '@/shared/components/calendar'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import '@/shared/components/calendar/styles/calendar.css'

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

function paymentOrderStatusToInstructorUiStatus(
  s: PaymentOrderAdminProcessingStatus
): InstructorSettlementUiStatus {
  switch (s) {
    case 'pending':
      return 'awaiting_confirmation'
    case 'confirmed':
      return 'payment_statement_verified'
    case 'correction':
      return 'payment_correction_requested'
    case 'application_rejected':
      return 'application_rejected'
    default:
      return 'none'
  }
}

function paymentStatusShortLabelForCalendarPreview(
  s: PaymentOrderAdminProcessingStatus
): string {
  const uiStatus = paymentOrderStatusToInstructorUiStatus(s)
  switch (uiStatus) {
    case 'awaiting_confirmation':
      return '확인 대기'
    case 'partial_confirmation':
      return '확인 중'
    case 'payment_statement_verified':
      return '확인 완료'
    case 'account_paid':
      return '계좌 지급'
    case 'payment_correction_requested':
      return '정정 요청'
    case 'application_rejected':
      return '신청 반려'
    default:
      return '확인 대기'
  }
}

/** 지급조서 확인 캘린더 한정: 정정 요청은 핑크 대신 빨간 톤 */
function paymentOrderCalendarStatusColorPair(status: InstructorSettlementUiStatus): ScheduleColorPair {
  if (status === 'payment_correction_requested') {
    return settlementEventStatusColorPair('application_rejected')
  }
  return settlementEventStatusColorPair(status)
}

function paymentOrderStatusShortLabelFromUiStatus(status: InstructorSettlementUiStatus): string {
  switch (status) {
    case 'awaiting_confirmation':
      return '확인 대기'
    case 'partial_confirmation':
      return '확인 중'
    case 'payment_statement_verified':
      return '확인 완료'
    case 'account_paid':
      return '계좌 지급'
    case 'payment_correction_requested':
      return '정정 요청'
    case 'application_rejected':
      return '신청 반려'
    default:
      return '확인 대기'
  }
}

/** 지급조서 확인 캘린더 한정: tooltip 상태 문구 축약 */
function renderPaymentOrdersEventsTooltipContent({ events: dayEvents }: { events: CalendarItem[] }) {
  return (
    <div className="settlement-preview-tooltip">
      {dayEvents.map(ev => {
        const row = settlementRowFromCalendarItem(ev)
        const colors = paymentOrderCalendarStatusColorPair(row.status)
        return (
          <div key={String(ev.id)} className="instructor-settlement-preview">
            <div className="instructor-settlement-preview__title">
              {settlementCalendarPrimaryTitle(row)}
            </div>
            <div>
              <span style={{ color: colors.text, fontWeight: 700, fontSize: '14px' }}>
                {paymentOrderStatusShortLabelFromUiStatus(row.status)}
              </span>
              <span className="settlement-preview-tooltip__text">
                <span className="settlement-preview-tooltip__sep">|</span> +
                {row.scheduledAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function placeholderInvoiceForPaymentOrderCalendar(
  programName: string,
  institutionName: string,
  lectureDateSessions: string,
  amount: number,
  status: InstructorSettlementUiStatus
): InstructorSettlementInvoiceDetail {
  return {
    programName,
    sessionProgress: '—',
    operationPeriod: '—',
    paymentStatementStatus: status,
    expectedTransferDate: '—',
    lectureFeeBasis: '—',
    businessIncomeEarner: '해당 없음',
    institutionName,
    lectureDateSessions,
    lineItems: [
      {
        key: 'estimated',
        산정항목: '예상 정산',
        항목설명: '지급조서 확인(관리) 캘린더',
        정산금액: amount,
        isPositive: true,
      },
    ],
    withholdingRatePercent: 0,
    withholdingAmount: 0,
    totalFormulaLabel: '예상 정산',
    totalAmount: amount,
  }
}

function paymentEventToSettlementListRow(
  ev: PaymentOrderCalendarEvent
): InstructorSettlementListRow {
  const uiStatus = paymentOrderStatusToInstructorUiStatus(ev.status)
  const calendarDate = ev.date.format('YYYY-MM-DD')
  const isProgramExposure = ev.exposure === 'program'
  const programRow = ev.sourceProgramRow
  const isProgram = isProgramExposure && programRow != null
  const programNameForRow = isProgram
    ? ev.bracketTitle
    : ev.sourceInstructorRow
      ? ev.cardSubtitle || ev.sourceInstructorRow.relatedProgramNames.join(', ') || '—'
      : ev.bracketTitle
  const institutionName = isProgram
    ? `정산 대상 강사 ${programRow.instructorCount}명`
    : ev.cardSubtitle || '—'
  const invoiceProgramName = isProgram
    ? programRow.programName
    : ev.sourceInstructorRow?.relatedProgramNames[0] ?? ev.cardSubtitle ?? programNameForRow

  return {
    id: ev.id,
    no: isProgram ? programRow.no : (ev.sourceInstructorRow?.no ?? 0),
    programName: programNameForRow,
    instructorName: isProgram
      ? undefined
      : ev.sourceInstructorRow
        ? instructorDisplayTitle(ev.sourceInstructorRow.instructorName)
        : undefined,
    settlementListTitleVariant: isProgramExposure ? 'bracket-program' : 'plain-instructor',
    institutionName,
    lectureDateDisplay: ev.date.format('YYYY.MM.DD (ddd)'),
    calendarDate,
    status: uiStatus,
    scheduledAmount: ev.amount,
    detailAvailable: true,
    invoice: placeholderInvoiceForPaymentOrderCalendar(
      invoiceProgramName,
      '—',
      `${calendarDate} · ${ev.cardSubtitle || ''}`,
      ev.amount,
      uiStatus
    ),
  }
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

export type PaymentOrdersCalendarDetailClick =
  | { exposure: 'program'; row: PaymentOrderAdminProgramRow }
  | { exposure: 'instructor'; row: PaymentOrderAdminInstructorRow }

/** 상단 기간 필터 `dateRangeOneMonthFromStart`와 동일: 해당 월 1일 ~ 익월 1일 */
function oneMonthRangeMatchingFilter(month: Dayjs): [Dayjs, Dayjs] {
  return getPaymentOrdersMonthFilterRange(month)
}

export interface PaymentOrdersCalendarViewProps {
  exposure: PaymentOrdersCalendarExposure
  programRows: PaymentOrderAdminProgramRow[]
  instructorRows: PaymentOrderAdminInstructorRow[]
  /** API 캘린더 이벤트 — 있으면 mock 집계 대신 사용 */
  eventsOverride?: PaymentOrderCalendarEvent[]
  /** URL·조회에 적용된 기간(실제 출강일). 없으면 데이터 앵커 월을 표시 */
  filterDateRange: [Dayjs, Dayjs] | null
  /** 캘린더 헤더 네비·날짜 선택 시 기간 필터·URL과 동일하게 맞출 때 호출 */
  onFilterDateRangeApply?: (range: [Dayjs, Dayjs]) => void
  /** 우측 목록 카드 클릭 시 지급 현황 상세(풀페이지 모달) */
  onPaymentStatusDetailClick?: (payload: PaymentOrdersCalendarDetailClick) => void
}

function resolveSelectedDateWithRange(
  range: [Dayjs, Dayjs] | null | undefined,
  anchor: Dayjs,
  fallback?: Dayjs
): Dayjs {
  const from = range?.[0]
  const to = range?.[1]
  if (!from || !to) return fallback ?? anchor

  const today = dayjs()
  if (!today.isBefore(from, 'day') && !today.isAfter(to, 'day')) {
    return today
  }
  if (fallback && !fallback.isBefore(from, 'day') && !fallback.isAfter(to, 'day')) {
    return fallback
  }
  return from
}

function filterEventsByDateRange<T extends { date: Dayjs }>(
  items: T[],
  range: [Dayjs, Dayjs] | null | undefined
): T[] {
  if (!range?.[0] || !range[1]) return items
  const [from, to] = range
  return items.filter(ev => !ev.date.isBefore(from, 'day') && !ev.date.isAfter(to, 'day'))
}

type CalendarMainEventRow = {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: InstructorSettlementListRow
  startTime?: string
  endTime?: string
  timeGridLabel?: string
  weekGridSurface?: { bg: string; border: string; text: string }
}

export function PaymentOrdersCalendarView({
  exposure,
  programRows,
  instructorRows,
  eventsOverride,
  filterDateRange,
  onFilterDateRangeApply,
  onPaymentStatusDetailClick,
}: PaymentOrdersCalendarViewProps) {
  const events = useMemo(() => {
    if (eventsOverride) {
      return filterEventsByDateRange(eventsOverride, filterDateRange)
    }
    const raw =
      exposure === 'program'
        ? eventsFromPrograms(programRows)
        : eventsFromInstructors(instructorRows)
    return filterEventsByDateRange(raw, filterDateRange)
  }, [eventsOverride, exposure, programRows, instructorRows, filterDateRange])

  const eventById = useMemo(() => new Map(events.map(e => [e.id, e] as const)), [events])

  const uniqueSettlementRows = useMemo(() => {
    const m = new Map<string, InstructorSettlementListRow>()
    for (const ev of events) {
      const row = paymentEventToSettlementListRow(ev)
      m.set(row.id, row)
    }
    return [...m.values()]
  }, [events])

  const calendarMainEvents = useMemo((): CalendarMainEventRow[] => {
    return events.map(ev => {
      const row = paymentEventToSettlementListRow(ev)
      return {
        id: ev.id,
        title: `+${row.scheduledAmount.toLocaleString('ko-KR')}원 | ${paymentStatusShortLabelForCalendarPreview(
          ev.status
        )}`,
        startDate: ev.date.format('YYYY-MM-DD'),
        endDate: ev.date.format('YYYY-MM-DD'),
        originalItem: row,
        startTime: ev.startTime,
        endTime: ev.endTime,
        timeGridLabel: ev.weekGridLabel ?? ev.bracketTitle,
        weekGridSurface: weekGridSurfaceForPaymentEvent(ev.id),
      }
    })
  }, [events])

  const overrideEventColorMap = useCallback((items: CalendarItem[]) => {
    const map = new Map<string | number, ScheduleColorPair>()
    for (const item of items) {
      const ev = eventById.get(String(item.id))
      if (!ev) continue
      map.set(item.id, paymentOrderCalendarStatusColorPair(paymentOrderStatusToInstructorUiStatus(ev.status)))
    }
    return map
  }, [eventById])

  const resolveSettlementRowColors = useCallback(
    (row: InstructorSettlementListRow): ScheduleColorPair | undefined => {
      const ev = eventById.get(row.id)
      if (!ev) return undefined
      return paymentOrderCalendarStatusColorPair(paymentOrderStatusToInstructorUiStatus(ev.status))
    },
    [eventById]
  )

  const resolveSettlementBadgeLabel = useCallback(
    (row: InstructorSettlementListRow): string | undefined => {
      const ev = eventById.get(row.id)
      if (!ev) return undefined
      return paymentStatusShortLabelForCalendarPreview(ev.status)
    },
    [eventById]
  )

  const anchor = useMemo(
    () => pickAnchorDateForExposure(exposure, programRows, instructorRows),
    [exposure, programRows, instructorRows]
  )

  const viewMonth = useMemo(
    () => (filterDateRange?.[0] ? filterDateRange[0].startOf('month') : anchor.startOf('month')),
    [filterDateRange, anchor]
  )

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() =>
    resolveSelectedDateWithRange(filterDateRange, anchor)
  )
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => viewMonth)

  useEffect(() => {
    setCurrentMonth(viewMonth)
  }, [viewMonth])

  useEffect(() => {
    setSelectedDate(prev => {
      return resolveSelectedDateWithRange(filterDateRange, anchor, prev)
    })
  }, [filterDateRange, anchor])

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  /** 프로그램별·강사별 모두 월간만 사용 */
  const onSelectDate = useCallback(
    (date: Dayjs) => {
      setSelectedDate(date)
      if (!date.isSame(currentMonth, 'month')) {
        setCurrentMonth(date.startOf('month'))
        onFilterDateRangeApply?.(oneMonthRangeMatchingFilter(date))
      }
    },
    [currentMonth, onFilterDateRangeApply]
  )

  const onMonthChange = useCallback(
    (next: Dayjs) => {
      setCurrentMonth(next)
      onFilterDateRangeApply?.(oneMonthRangeMatchingFilter(next))
    },
    [onFilterDateRangeApply]
  )

  const onTodayClick = useCallback(() => {
    const today = dayjs()
    setSelectedDate(today)
    setCurrentMonth(today.startOf('month'))
    onFilterDateRangeApply?.(oneMonthRangeMatchingFilter(today))
  }, [onFilterDateRangeApply])

  const handleSettlementRowClick = useCallback(
    (row: InstructorSettlementListRow) => {
      if (!onPaymentStatusDetailClick) return
      const ev = eventById.get(row.id)
      if (!ev) return
      if (ev.exposure === 'program' && ev.sourceProgramRow) {
        onPaymentStatusDetailClick({ exposure: 'program', row: ev.sourceProgramRow })
        return
      }
      if (ev.exposure === 'instructor' && ev.sourceInstructorRow) {
        onPaymentStatusDetailClick({ exposure: 'instructor', row: ev.sourceInstructorRow })
      }
    },
    [eventById, onPaymentStatusDetailClick]
  )

  return (
    <div className="calendar-set">
      <div className="calendar-main-container">
        <CalendarMain
          mode="month"
          hideModeToggle
          onModeChange={() => {}}
          events={calendarMainEvents}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onMonthChange={onMonthChange}
          onTodayClick={onTodayClick}
          selectedRowKeys={selectedRowKeys}
          overrideEventColorMap={overrideEventColorMap}
          eventsTooltipScope="full-day"
          eventsTooltipTrigger="cell"
          formatEventsOverflowText={n => `외 ${n}개의 항목`}
          previewTooltipContent={renderPaymentOrdersEventsTooltipContent}
          tooltipOverlayClassName="payment-orders-calendar-tooltip-overlay"
        />
      </div>
      <div className="calendar-sub-right-list">
        <CalendarSubRightSettlementList
            key={`${exposure}-${selectedDate.format('YYYY-MM-DD')}`}
            selectedDate={selectedDate}
            rows={uniqueSettlementRows}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
            onRowClick={handleSettlementRowClick}
            resolveRowColors={resolveSettlementRowColors}
            resolveBadgeLabel={resolveSettlementBadgeLabel}
          />
      </div>
    </div>
  )
}
