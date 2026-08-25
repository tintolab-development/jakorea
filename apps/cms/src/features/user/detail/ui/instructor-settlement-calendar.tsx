/**
 * 강사 정산 현황 — `CalendarMain` + `CalendarSubRightSettlementList`를 `calendar-set`과 유사한 가로 뼈대로 배치.
 * 우측 리스트는 `CalendarListItemContentSettlement`로 정산 행을 표시합니다.
 */

import { useMemo, useCallback } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
} from '@/shared/constants/instructor-settlement-status'
import type { InstructorSettlementListRow } from '@/features/user/detail/model/instructor-settlement-types'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import {
  CalendarMain,
  CalendarSubRightSettlementList,
  renderSettlementEventsTooltipContent,
  settlementEventStatusColorPair,
  settlementRowFromCalendarItem,
  type CalendarItem,
} from '@/shared/components/calendar'
import '@/shared/components/calendar/styles/calendar.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export interface SettlementCalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: InstructorSettlementListRow
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
  const uniqueRows = useMemo(() => {
    const m = new Map<string, InstructorSettlementListRow>()
    for (const e of events) {
      m.set(e.originalItem.id, e.originalItem)
    }
    return [...m.values()]
  }, [events])

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

  const overrideEventColorMap = useCallback((items: CalendarItem[]) => {
    const map = new Map<string | number, ScheduleColorPair>()
    for (const item of items) {
      const row = settlementRowFromCalendarItem(item)
      map.set(item.id, settlementEventStatusColorPair(row.status))
    }
    return map
  }, [])

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
    <div className="calendar-set">
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
          eventsTooltipTrigger="cell"
          previewTooltipContent={renderSettlementEventsTooltipContent}
        />
      </div>
      <div className="calendar-sub-right-list">
        <CalendarSubRightSettlementList
          selectedDate={selectedDate}
          rows={uniqueRows}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onRowClick={onSettlementClick}
        />
      </div>
    </div>
  )
}
