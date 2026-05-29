import type { ReactNode } from 'react'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import type { CalendarItem } from '../lib/calendar-helpers'

/** 월간 셀 `.calendar-event` strip 1행 — shell은 공통, 내부 UI는 페이지 `renderMonthEventContent` */
export type CalendarMonthCellRow = {
  id: string | number
  sourceEvent: CalendarItem
  /** 페이지별 렌더에 넘길 데이터 (UJAT titleParts 등) */
  meta?: unknown
}

export type RenderCalendarMonthEventContentArgs = {
  row: CalendarMonthCellRow
  dayEvents: CalendarItem[]
  colors: ScheduleColorPair
  isSelected: boolean
}

export type BuildCalendarMonthCellRows = (dayEvents: CalendarItem[]) => CalendarMonthCellRow[]

export type RenderCalendarMonthEventContent = (
  args: RenderCalendarMonthEventContentArgs
) => ReactNode
