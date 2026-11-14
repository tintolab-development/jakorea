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
  type RenderCalendarMonthEventContent,
} from '@/shared/components/calendar'
import { CalendarMonthEventTitleWithDivider } from '@/shared/components/calendar/ui/calendar-month-event-title'
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

  /**
   * 월간 셀 「+금액원 │ 상태」 — 문자 `|` 대신 공통 구분선(`calendar-event-title--with-divider`)으로 그린다.
   * (시안 4427:72829, 구분선 점검 #14) 툴팁·접근성용 `title` 문자열은 그대로 둔다.
   */
  const renderMonthEventContent = useCallback<RenderCalendarMonthEventContent>(
    ({ row, colors }) => {
      const event = row.sourceEvent.original as SettlementCalendarEvent | undefined
      const settlement = event?.originalItem
      if (!settlement) {
        return <span className="calendar-event-title">{String(row.sourceEvent.title ?? '')}</span>
      }
      return (
        <CalendarMonthEventTitleWithDivider
          parts={{
            left: `+${settlement.scheduledAmount.toLocaleString()}원`,
            right: INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT[settlement.status],
          }}
          accentColor={colors.text}
        />
      )
    },
    []
  )

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
    // 시안 4427:72829: 상세 캘린더뷰 셸(r16 · #E0E0E0 · padding 20, 요약 카드 ↔ 캘린더 24) — page-scroll 변형
    <div className="calendar-set calendar-set--page-scroll">
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
          renderMonthEventContent={renderMonthEventContent}
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
