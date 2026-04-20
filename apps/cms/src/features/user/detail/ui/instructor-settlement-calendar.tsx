/**
 * 강사 정산 현황 — `CalendarMain` 헤더(제목·오늘·이전/다음만, 월간 전용) +
 * `calendar-main-container` / `calendar-sub-right-list` 레이아웃 + 이벤트 모드 그리드·우측 목록
 */

import { useMemo, useCallback } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  type InstructorSettlementListRow,
} from '@/data/mock/instructor-member-settlements'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import { CalendarMain, CalendarSubRightList, type CalendarItem } from '@/shared/components/calendar'
import '@/shared/components/calendar/calendar.css'
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

function settlementRowFromCalendarItem(item: CalendarItem): InstructorSettlementListRow {
  const o = item.original
  if (o != null && typeof o === 'object' && 'originalItem' in o) {
    return (o as { originalItem: InstructorSettlementListRow }).originalItem
  }
  throw new Error('InstructorSettlementCalendarView: expected event with originalItem')
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
  const calendarMainEvents = useMemo(() => {
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

  const overrideEventColorMap = useCallback((items: CalendarItem[]) => {
    const map = new Map<string | number, ScheduleColorPair>()
    for (const item of items) {
      const row = settlementRowFromCalendarItem(item)
      map.set(item.id, statusToColor(row.status))
    }
    return map
  }, [])

  const dayRows = useMemo(() => {
    const evs = getEventsForDate(selectedDate)
    return evs.map(e => e.originalItem)
  }, [getEventsForDate, selectedDate])

  const handleDateSelect = useCallback(
    (date: Dayjs) => {
      onSelectedDateChange(date)
      if (!date.isSame(currentMonth, 'month')) {
        onDisplayMonthChange(date.startOf('month'))
      }
    },
    [currentMonth, onDisplayMonthChange, onSelectedDateChange]
  )

  const handleTodayClick = useCallback(() => {
    const today = dayjs()
    onSelectedDateChange(today)
    onDisplayMonthChange(today.startOf('month'))
  }, [onDisplayMonthChange, onSelectedDateChange])

  return (
    <div className="calendar-layout">
      <div className="calendar-main-container">
        <CalendarMain
          mode="month"
          onModeChange={() => {}}
          hideModeToggle
          events={calendarMainEvents}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          onMonthChange={onDisplayMonthChange}
          onTodayClick={handleTodayClick}
          selectedRowKeys={selectedRowKeys}
          overrideEventColorMap={overrideEventColorMap}
          scheduleOverlay="tooltip"
          eventsTooltipTrigger="cell"
          renderEventsTooltipContent={({ events: dayEvents }) => (
            <div className="program-calendar-schedule-panel">
              {dayEvents.map(ev => {
                const row = settlementRowFromCalendarItem(ev)
                const colors = statusToColor(row.status)
                return (
                  <div key={String(ev.id)} className="instructor-settlement-preview">
                    <div className="instructor-settlement-preview__title">[{row.programName}]</div>
                    <div>
                      <span style={{ color: colors.text, fontWeight: 700, fontSize: '14px' }}>
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
      </div>
      <div className="calendar-sub-right-list">
        <CalendarSubRightList
          selectedDate={selectedDate}
          rows={dayRows}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onRowClick={onSettlementClick}
        />
      </div>
    </div>
  )
}
