/**
 * 정산 관리 > 계좌 지급 확인 — 캘린더 뷰
 * `calendar-set` + 좌측 미니캘린더·프로그램 검색(`CalendarMini` / `CalendarSearch`) + 메인 + 정산 우측 목록
 * 메인 캘린더는 **월간만** (주간 토글 없음).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  formatAccountPaymentInstitutionDisplay,
  formatAccountPaymentSessionLabelDisplay,
  resolveAccountPaymentAttendanceDate,
  type AccountPaymentRow,
} from '@/data/mock/account-payments-list'
import {
  settlementCalendarPrimaryTitle,
  type InstructorSettlementInvoiceDetail,
  type InstructorSettlementListRow,
  type InstructorSettlementUiStatus,
} from '@/data/mock/instructor-member-settlements'
import {
  CalendarMain,
  CalendarMini,
  CalendarSearch,
  CalendarSubRightSettlementList,
  settlementEventStatusColorPair,
  settlementRowFromCalendarItem,
  useCalendarMiniState,
  type CalendarItem,
} from '@/shared/components/calendar'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import '@/shared/components/calendar/styles/calendar.css'

function pickAnchorDate(rows: AccountPaymentRow[]): Dayjs {
  if (rows.length === 0) return dayjs()
  let min = dayjs(resolveAccountPaymentAttendanceDate(rows[0]))
  for (let i = 1; i < rows.length; i++) {
    const d = dayjs(resolveAccountPaymentAttendanceDate(rows[i]))
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
              {settlementCalendarPrimaryTitle(row)}
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
    expectedTransferDate: `${d.format('YYYY. MM. DD')}(${['일', '월', '화', '수', '목', '금', '토'][d.day()]})`,
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
  const calendarDate = resolveAccountPaymentAttendanceDate(row).slice(0, 10)
  return {
    id: row.id,
    settlementId: row.settlementId ?? 0,
    no: row.no,
    programName: row.programName,
    instructorName: row.instructorName,
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
  const [calendarSearchKeyword, setCalendarSearchKeyword] = useState('')
  const [calendarProgramSelection, setCalendarProgramSelection] = useState<string[] | null>(null)

  const normalizedKeyword = useMemo(
    () => calendarSearchKeyword.trim().toLowerCase(),
    [calendarSearchKeyword]
  )

  const allProgramIds = useMemo(
    () => [...new Set(rows.map(r => r.programName))].sort((a, b) => a.localeCompare(b, 'ko')),
    [rows]
  )

  const programFilterOptions = useMemo(() => {
    const keywordFiltered = normalizedKeyword
      ? rows.filter(
          r =>
            r.programName.toLowerCase().includes(normalizedKeyword) ||
            r.instructorName.toLowerCase().includes(normalizedKeyword)
        )
      : rows
    const names = [...new Set(keywordFiltered.map(r => r.programName))].sort((a, b) =>
      a.localeCompare(b, 'ko')
    )
    return names.map(title => ({ id: title, title }))
  }, [rows, normalizedKeyword])

  const effectiveProgramSelection = useMemo(
    () => calendarProgramSelection ?? allProgramIds,
    [calendarProgramSelection, allProgramIds]
  )

  const programColorMap = useMemo(() => {
    const map = new Map<string, ScheduleColorPair>()
    allProgramIds.forEach(id => {
      const firstRow = rows.find(r => r.programName === id)
      if (!firstRow) return
      map.set(id, settlementEventStatusColorPair(accountPaymentStatusToUiStatus(firstRow.accountPaymentStatus)))
    })
    return map
  }, [allProgramIds, rows])

  const filteredRows = useMemo(() => {
    let r = rows
    if (normalizedKeyword) {
      r = r.filter(
        row =>
          row.programName.toLowerCase().includes(normalizedKeyword) ||
          row.instructorName.toLowerCase().includes(normalizedKeyword)
      )
    }
    if (calendarProgramSelection !== null) {
      const set = new Set(calendarProgramSelection)
      r = r.filter(row => set.has(row.programName))
    }
    return r
  }, [rows, normalizedKeyword, calendarProgramSelection])

  const programDates = useMemo(() => {
    const dates = new Set<string>()
    for (const row of filteredRows) {
      dates.add(resolveAccountPaymentAttendanceDate(row).slice(0, 10))
    }
    return dates
  }, [filteredRows])

  const settlementRows = useMemo(
    () => filteredRows.map(accountPaymentRowToSettlementListRow),
    [filteredRows]
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

  const anchor = useMemo(() => pickAnchorDate(rows), [rows])

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => anchor)
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => anchor.startOf('month'))
  const {
    selectedDate: miniSelectedDate,
    currentMonth: miniCurrentMonth,
    onSelectDate: onMiniSelectDate,
    onMonthChange: onMiniMonthChange,
  } = useCalendarMiniState(anchor)
  const isFirstFilteredRowsEffect = useRef(true)

  useEffect(() => {
    if (isFirstFilteredRowsEffect.current) {
      isFirstFilteredRowsEffect.current = false
      return
    }
    onSelectionChange([])
  }, [filteredRows, onSelectionChange])

  const handleProgramFilterChange = useCallback(
    (programId: string, checked: boolean) => {
      setCalendarProgramSelection(prev => {
        const base = prev ?? allProgramIds
        const next = checked
          ? [...new Set([...base, programId])]
          : base.filter(id => id !== programId)
        const allSelected =
          next.length === allProgramIds.length && allProgramIds.every(id => next.includes(id))
        return allSelected ? null : next
      })
    },
    [allProgramIds]
  )

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

  return (
    <div className="calendar-set">
      <div className="calendar-sub-left">
        <CalendarMini
          currentMonth={miniCurrentMonth}
          selectedDate={miniSelectedDate}
          onMonthChange={onMiniMonthChange}
          onSelectDate={onMiniSelectDate}
          programDates={programDates}
        />
        <CalendarSearch
          keyword={calendarSearchKeyword}
          options={programFilterOptions}
          selectedIds={effectiveProgramSelection}
          programColorMap={programColorMap}
          onKeywordChange={setCalendarSearchKeyword}
          onOptionToggle={handleProgramFilterChange}
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
        />
      </div>
    </div>
  )
}
