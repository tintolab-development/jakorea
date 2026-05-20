import type { Key, ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
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
