/**
 * 정산 관리 > 계좌 지급 확인 — 캘린더 뷰
 * `calendar-set` + 좌측 미니캘린더 + 메인(월간) + 정산 우측 목록 (프로그램 검색 필터 없음)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import {
  formatAccountPaymentInstitutionDisplay,
  formatAccountPaymentSessionLabelDisplay,
  resolveAccountPaymentCalendarDate,
  type AccountPaymentRow,
} from '@/features/settlement-management/model/account-payments-list'
import {
  type InstructorSettlementInvoiceDetail,
  type InstructorSettlementListRow,
  type InstructorSettlementUiStatus,
} from '@/features/settlement-management/model/instructor-member-settlements'
import {
  CalendarMain,
  CalendarMini,
  CalendarSubRightSettlementList,
  settlementEventStatusColorPair,
  settlementRowFromCalendarItem,
  type CalendarItem,
} from '@/shared/components/calendar'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import '@/shared/components/calendar/styles/calendar.css'
import './account-payments-calendar-view.css'

function pickAnchorDate(rows: AccountPaymentRow[]): Dayjs {
  if (rows.length === 0) return dayjs()
  let min = dayjs(resolveAccountPaymentCalendarDate(rows[0]))
  for (let i = 1; i < rows.length; i++) {
    const d = dayjs(resolveAccountPaymentCalendarDate(rows[i]))
    if (d.isBefore(min, 'day')) min = d
  }
  return min
}

function accountPaymentStatusToUiStatus(
  s: AccountPaymentRow['accountPaymentStatus']
): InstructorSettlementUiStatus {
  return s
}

function accountPaymentStatusShortLabel(status: AccountPaymentRow['accountPaymentStatus']): string {
  switch (status) {
    case 'awaiting_confirmation':
      return '지급 대기'
    case 'partial_confirmation':
      return '확인 중'
    case 'account_paid':
      return '지급 완료'
    case 'payment_correction_requested':
      return '정정 요청'
    default:
      return '지급 대기'
  }
}

function renderAccountPaymentEventsTooltipContent({ events: dayEvents }: { events: CalendarItem[] }) {
  return (
    <div className="settlement-preview-tooltip">
      {dayEvents.map(ev => {
        const row = settlementRowFromCalendarItem(ev)
        const colors = settlementEventStatusColorPair(row.status)
        const accountStatus = (ev.original as { originalItem: InstructorSettlementListRow }).originalItem
          .status as AccountPaymentRow['accountPaymentStatus']
        return (
          <div key={String(ev.id)} className="instructor-settlement-preview">
            <div className="instructor-settlement-preview__title">
              {row.instructorName?.trim()
                ? `${row.instructorName.trim()} | ${row.programName}`
                : row.programName}
            </div>
            <div>
              <span style={{ color: colors.text, fontWeight: 700, fontSize: '14px' }}>
                {accountPaymentStatusShortLabel(accountStatus)}
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

function placeholderInvoiceForAccountPaymentCalendar(
  row: AccountPaymentRow,
  status: InstructorSettlementUiStatus
): InstructorSettlementInvoiceDetail {
  const d = dayjs(row.transferScheduledDate)
  return {
    programName: row.programName,
    sessionProgress: formatAccountPaymentSessionLabelDisplay(row.sessionLabel),
    operationPeriod: '-',
    paymentStatementStatus: status,
    expectedTransferDate: formatDateDotWithWeekday(d),
    lectureFeeBasis: '-',
    businessIncomeEarner: '해당 없음',
    institutionName: formatAccountPaymentInstitutionDisplay(row.institutionName),
    lectureDateSessions: `${formatAccountPaymentSessionLabelDisplay(row.sessionLabel)} · ${row.instructorName}`,
    lineItems: [
      {
        key: 'estimated',
        산정항목: '정산 예정',
        항목설명: '계좌 지급 확인(관리) 캘린더',
        정산금액: row.amount,
        isPositive: true,
      },
    ],
    withholdingRatePercent: 0,
    withholdingAmount: 0,
    totalFormulaLabel: '정산 예정',
    totalAmount: row.amount,
  }
}

function accountPaymentRowToSettlementListRow(row: AccountPaymentRow): InstructorSettlementListRow {
  const status = accountPaymentStatusToUiStatus(row.accountPaymentStatus)
  const calendarDate = resolveAccountPaymentCalendarDate(row)
  return {
    id: row.id,
    settlementId: row.settlementId ?? 0,
    no: row.no,
    programName: row.programName,
    instructorName: row.instructorName,
    settlementListTitleVariant: 'pipe-program',
    institutionName: formatAccountPaymentInstitutionDisplay(row.institutionName),
    lectureDateDisplay: `${formatAccountPaymentSessionLabelDisplay(row.sessionLabel)} · ${row.instructorName}`,
    calendarDate,
    status,
    scheduledAmount: row.amount,
    detailAvailable: true,
    invoice: placeholderInvoiceForAccountPaymentCalendar(row, status),
  }
}

type CalendarMainSettlementEventRow = {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: InstructorSettlementListRow
}

export interface AccountPaymentsCalendarViewProps {
  rows: AccountPaymentRow[]
  /** 목록 뷰 테이블과 동일 — 툴바(대량이체·세금신고·일괄 지급) 선택 상태 */
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  /** 우측 정산 카드 열기 클릭 시(목록 행 클릭과 동일) */
  onAccountPaymentRowClick?: (row: AccountPaymentRow) => void
}

export function AccountPaymentsCalendarView({
  rows,
  selectedRowKeys,
  onSelectionChange,
  onAccountPaymentRowClick,
}: AccountPaymentsCalendarViewProps) {
  const anchor = useMemo(() => pickAnchorDate(rows), [rows])

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => anchor)
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => anchor.startOf('month'))
  const isFirstRowsEffect = useRef(true)

  useEffect(() => {
    if (isFirstRowsEffect.current) {
      isFirstRowsEffect.current = false
      return
    }
    onSelectionChange([])
  }, [rows, onSelectionChange])

  const programDates = useMemo(() => {
    const dates = new Set<string>()
    for (const row of rows) {
      const d = resolveAccountPaymentCalendarDate(row)
      if (d) dates.add(d)
    }
    return dates
  }, [rows])

  const settlementRows = useMemo(
    () => rows.map(accountPaymentRowToSettlementListRow),
    [rows]
  )

  const calendarMainEvents = useMemo((): CalendarMainSettlementEventRow[] => {
    return settlementRows.map(row => ({
      id: row.id,
      title: row.instructorName?.trim() || row.programName,
      startDate: row.calendarDate,
      endDate: row.calendarDate,
      originalItem: row,
    }))
  }, [settlementRows])

  const onSelectDate = useCallback(
    (date: Dayjs) => {
      setSelectedDate(date)
      if (!date.isSame(currentMonth, 'month')) {
        setCurrentMonth(date.startOf('month'))
      }
    },
    [currentMonth]
  )

  const onMonthChange = useCallback((next: Dayjs) => {
    const firstDayOfMonth = next.startOf('month')
    setCurrentMonth(firstDayOfMonth)
    setSelectedDate(firstDayOfMonth)
  }, [])

  const onTodayClick = useCallback(() => {
    const today = dayjs()
    setSelectedDate(today)
    setCurrentMonth(today.startOf('month'))
  }, [])

  const overrideEventColorMap = useCallback((items: CalendarItem[]) => {
    const map = new Map<string | number, ScheduleColorPair>()
    for (const item of items) {
      const row = settlementRowFromCalendarItem(item)
      map.set(item.id, settlementEventStatusColorPair(row.status))
    }
    return map
  }, [])

  const handleSettlementRowClick = useCallback(
    (r: InstructorSettlementListRow) => {
      const ap = rows.find(x => x.id === r.id)
      if (ap) onAccountPaymentRowClick?.(ap)
    },
    [rows, onAccountPaymentRowClick]
  )

  const resolveBadgeLabel = useCallback((row: InstructorSettlementListRow) => {
    return accountPaymentStatusShortLabel(row.status as AccountPaymentRow['accountPaymentStatus'])
  }, [])

  return (
    <div className="calendar-set account-payments-calendar-view">
      <div className="calendar-sub-left account-payments-calendar-view__sub-left">
        <CalendarMini
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onMonthChange={onMonthChange}
          onSelectDate={onSelectDate}
          programDates={programDates}
        />
      </div>
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
          previewTooltipContent={renderAccountPaymentEventsTooltipContent}
        />
      </div>
      <div className="calendar-sub-right-list">
        <CalendarSubRightSettlementList
          key={selectedDate.format('YYYY-MM-DD')}
          selectedDate={selectedDate}
          rows={settlementRows}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onRowClick={handleSettlementRowClick}
          resolveBadgeLabel={resolveBadgeLabel}
        />
      </div>
    </div>
  )
}
