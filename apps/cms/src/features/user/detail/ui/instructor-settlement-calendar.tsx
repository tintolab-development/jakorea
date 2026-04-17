/**
 * 강사 정산 현황 — 공유 `ProgramCalendar`(events) + 신청 강사 레이아웃·CSS 재사용 (월 뷰만)
 */

import { useRef, useMemo, useLayoutEffect, useCallback, type CSSProperties } from 'react'
import { Checkbox, Empty } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
  type InstructorSettlementListRow,
} from '@/data/mock/instructor-member-settlements'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import {
  ProgramCalendar,
  type ProgramCalendarEventItem,
} from '@/shared/components/program-calendar'
import '@/shared/components/program-calendar.css'
import '@/features/program/program-detail/ui/applicant-list/applicant-calendar-view.css'
import './instructor-settlement-calendar.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export interface SettlementCalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: InstructorSettlementListRow
}

function statusToColor(status: InstructorSettlementListRow['status']): ScheduleColorPair {
  const style = INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[status]
  return {
    name: 'gray',
    text: style.color,
    border: style.border,
    bg: style.bg,
  } as ScheduleColorPair
}

/** 우측 일정 카드 하단 배지 문구 (디자인 시안 짧은 표기) */
const INSTRUCTOR_SETTLEMENT_LIST_BADGE_LABEL: Record<
  InstructorSettlementListRow['status'],
  string
> = {
  awaiting_confirmation: '확인 대기',
  partial_confirmation: '일부 확인',
  payment_statement_verified: '확인 완료',
  account_paid: '계좌 지급',
  none: '해당 없음',
  application_rejected: '반려',
  payment_correction_requested: '정정 요청',
}

interface InstructorSettlementScheduleListProps {
  selectedDate: Dayjs
  rows: InstructorSettlementListRow[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onRowClick: (row: InstructorSettlementListRow) => void
}

function InstructorSettlementScheduleList({
  selectedDate,
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
}: InstructorSettlementScheduleListProps) {
  const toggleKey = (key: React.Key, checked: boolean) => {
    if (checked) onSelectionChange([...selectedRowKeys, key])
    else onSelectionChange(selectedRowKeys.filter(k => k !== key))
  }

  return (
    <div className="applicant-calendar-right instructor-settlement-calendar-right">
      <div className="applicant-schedule-list instructor-settlement-schedule-list">
        <div className="applicant-schedule-list-content">
          {rows.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={`${selectedDate.format('YYYY.MM.DD')} 정산 일정이 없습니다.`}
            />
          ) : (
            rows.map(row => {
              const st = INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[row.status]
              const badgeLabel = INSTRUCTOR_SETTLEMENT_LIST_BADGE_LABEL[row.status]
              const checked = selectedRowKeys.includes(row.id)
              const colors = statusToColor(row.status)
              return (
                <div
                  key={row.id}
                  className={`applicant-schedule-item instructor-settlement-schedule-item ${checked ? 'applicant-schedule-item--selected instructor-settlement-schedule-item--selected' : ''}`}
                  style={
                    {
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                      '--instructor-settlement-card-bg': colors.bg,
                      '--instructor-settlement-card-border': colors.border,
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    className="applicant-schedule-item-info instructor-settlement-schedule-item__open instructor-payment-schedule-list__open"
                    onClick={() => onRowClick(row)}
                  >
                    <div className="instructor-settlement-schedule-item__title">
                      [{row.programName}]
                    </div>
                    <div className="instructor-settlement-schedule-item__meta">
                      <span
                        className="instructor-settlement-schedule-item__badge"
                        style={{
                          color: st.color,
                          borderColor: st.color,
                        }}
                      >
                        {badgeLabel}
                      </span>
                      <span className="instructor-settlement-schedule-item__meta-sep" aria-hidden>
                        |
                      </span>
                      <span className="instructor-settlement-schedule-item__amount">
                        +{row.scheduledAmount.toLocaleString()}원
                      </span>
                    </div>
                  </button>
                  <div
                    className="applicant-schedule-item-checkbox instructor-settlement-schedule-item__checkbox"
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={e => toggleKey(row.id, e.target.checked)}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export interface InstructorSettlementCalendarViewProps {
  events: SettlementCalendarEvent[]
  currentMonth: Dayjs
  /** 표시 월만 변경 (날짜 셀에서 타월 선택 시 — 선택일은 그대로) */
  onDisplayMonthChange: (d: Dayjs) => void
  selectedDate: Dayjs
  onSelectedDateChange: (d: Dayjs) => void
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onSettlementClick: (row: InstructorSettlementListRow) => void
}

export function InstructorSettlementCalendarView({
  events,
  currentMonth,
  onDisplayMonthChange,
  selectedDate,
  onSelectedDateChange,
  selectedRowKeys,
  onSelectionChange,
  onSettlementClick,
}: InstructorSettlementCalendarViewProps) {
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  const programCalendarEvents = useMemo((): ProgramCalendarEventItem[] => {
    return events.map(ev => {
      const row = ev.originalItem
      const short = INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT[row.status]
      return {
        id: ev.id,
        title: `+${row.scheduledAmount.toLocaleString()}원 | ${short}`,
        startDate: ev.startDate,
        endDate: ev.endDate,
        originalItem: ev.originalItem,
      }
    })
  }, [events])

  const getEventsForDate = useCallback(
    (date: Dayjs): SettlementCalendarEvent[] =>
      events.filter(event => {
        const start = dayjs(event.startDate)
        const end = dayjs(event.endDate)
        return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
      }),
    [events]
  )

  const overrideEventColorMap = useCallback((dayEvents: ProgramCalendarEventItem[]) => {
    const map = new Map<string | number, ScheduleColorPair>()
    for (const event of dayEvents) {
      const row = event.originalItem as InstructorSettlementListRow
      map.set(event.id, statusToColor(row.status))
    }
    return map
  }, [])

  const dayRows = useMemo(() => {
    const evs = getEventsForDate(selectedDate)
    return evs.map(e => e.originalItem)
  }, [getEventsForDate, selectedDate])

  useLayoutEffect(() => {
    const main = mainCalendarRef.current
    if (!main) return
    const ROWS = 6
    const MIN_ROW = 124.2
    const BOTTOM_RESERVE = 12
    const applyMonthRowHeight = () => {
      const thead = main.querySelector('.ant-picker-content thead')
      if (!thead) {
        main.style.removeProperty('--program-calendar-month-row-height')
        return
      }
      const mainRect = main.getBoundingClientRect()
      const padBottom = parseFloat(getComputedStyle(main).paddingBottom) || 0
      const innerBottom = mainRect.bottom - padBottom
      const tbodyTop = thead.getBoundingClientRect().bottom
      const forBody = Math.max(0, innerBottom - tbodyTop - BOTTOM_RESERVE)
      const rowPx = Math.max(MIN_ROW, forBody / ROWS)
      main.style.setProperty(
        '--program-calendar-month-row-height',
        `${Math.round(rowPx * 10) / 10}px`
      )
    }
    const ro = new ResizeObserver(() => requestAnimationFrame(applyMonthRowHeight))
    ro.observe(main)
    const parent = main.parentElement
    if (parent) ro.observe(parent)
    requestAnimationFrame(applyMonthRowHeight)
    return () => {
      ro.disconnect()
      main.style.removeProperty('--program-calendar-month-row-height')
    }
  }, [currentMonth])

  const handleDateSelect = (date: Dayjs) => {
    onSelectedDateChange(date)
    if (!date.isSame(currentMonth, 'month')) {
      onDisplayMonthChange(date.startOf('month'))
    }
  }

  return (
    <div className="applicant-calendar-layout">
      <ProgramCalendar
        ref={mainCalendarRef}
        className="applicant-calendar-main"
        hideHeader
        mode="month"
        onModeChange={() => {}}
        events={programCalendarEvents}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        onMonthChange={onDisplayMonthChange}
        selectedRowKeys={selectedRowKeys}
        overrideEventColorMap={overrideEventColorMap}
        scheduleOverlay="tooltip"
        eventsTooltipTrigger="cell"
        tooltipOverlayClassName="program-calendar-tooltip-overlay--settlement"
        renderEventsTooltipContent={({ events: dayEvents }) => (
          <div className="program-calendar-schedule-panel">
            {dayEvents.map(ev => {
              const row = ev.originalItem as InstructorSettlementListRow
              const colors = statusToColor(row.status)
              return (
                <div key={String(ev.id)} className="program-calendar-schedule-panel__row">
                  <div className="program-calendar-schedule-panel__title">[{row.programName}]</div>
                  <div>
                    <span style={{ color: colors.text, fontWeight: 700 }}>
                      {INSTRUCTOR_SETTLEMENT_STATUS_LABELS[row.status]}
                    </span>
                    <span className="program-calendar-schedule-panel__text">
                      <span className="program-calendar-schedule-panel__sep">|</span> +
                      {row.scheduledAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      />
      <InstructorSettlementScheduleList
        selectedDate={selectedDate}
        rows={dayRows}
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={onSelectionChange}
        onRowClick={onSettlementClick}
      />
    </div>
  )
}
