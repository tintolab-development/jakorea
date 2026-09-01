import type { Key, ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import type {
  BuildCalendarMonthCellRows,
  RenderCalendarMonthEventContent,
} from '../model/calendar-month-cell-row'
import type { CalendarItem } from '../lib/calendar-helpers'

export type CalendarEventsConfig = {
  selectedRowKeys: Key[]
  previewTooltipContent?: (args: {
    events: CalendarItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
  overrideEventColorMap?: (dayEvents: CalendarItem[]) => Map<string | number, ScheduleColorPair>
  resolveEventColors?: (item: CalendarItem) => ScheduleColorPair | undefined
  eventsTooltipScope: 'trigger-only' | 'full-day'
  formatEventsOverflowText?: (hiddenCount: number) => string
  eventsTooltipTrigger: 'event-strip' | 'cell'
  /** 월간 셀 strip 목록. 미지정 시 dayEvents 1:1 */
  buildMonthCellRows?: BuildCalendarMonthCellRows
  /** 월간 strip 내부 UI. shell(`.calendar-event`·색상)은 공통, 내용만 페이지별 */
  renderMonthEventContent?: RenderCalendarMonthEventContent
}

export type CalendarCellProps = {
  date: Dayjs
  items: CalendarItem[]
  selectedDate: Dayjs
  currentMonth: Dayjs
  mode: 'month' | 'week'
  selectedKeys: Key[]
  colorMap: Map<string | number, ScheduleColorPair>
  onSelectDate: (date: Dayjs) => void
  overlayEnabled: boolean
  overlayContent: ReactNode
  tooltipOverlayClassName?: string
  /** 이벤트 모드에서만 전달 (스트립 툴팁 등). */
  eventsConfig?: CalendarEventsConfig
  buildResolvedColorMap?: (dayEvents: CalendarItem[]) => Map<string | number, ScheduleColorPair>
}

export type CalendarCellEventModeProps = CalendarCellProps & {
  eventsConfig: CalendarEventsConfig
  buildResolvedColorMap: NonNullable<CalendarCellProps['buildResolvedColorMap']>
}
