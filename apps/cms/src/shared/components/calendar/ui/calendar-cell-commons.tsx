import { type Key, type ReactElement, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import { getProgramDayScheduleLine } from '@/entities/program/lib/program-day-schedule-line'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'
import { ProgramCalendarOverlayFollowCursor } from '@/shared/components/program-calendar-cursor-overlay'
import {
  calendarItemForScheduleSource,
  resolveItemColor,
  type CalendarItem,
} from '../lib/calendar-helpers'
import { renderProgramApplicantPreviewTooltipContent } from './preview-tooltip/program'

export function CalendarItemList({
  items,
  selectedKeys,
  colorMap,
  limit = 2,
  onItemClick,
}: {
  items: CalendarItem[]
  selectedKeys: Key[]
  colorMap: Map<string | number, ScheduleColorPair>
  limit?: number
  onItemClick?: (item: CalendarItem) => void
}) {
  return (
    <>
      {items.slice(0, limit).map(item => {
        const colors = resolveItemColor(item, colorMap, SCHEDULE_COLORS[0])
        const isSelected = selectedKeys.includes(item.id)

        return (
          <div
            key={item.id}
            className={`calendar-event ${isSelected ? 'calendar-event--selected' : ''}`}
            style={{ backgroundColor: colors.bg }}
            onClick={e => {
              e.stopPropagation()
              onItemClick?.(item)
            }}
          >
            <span className="calendar-event-title">{item.title}</span>
          </div>
        )
      })}

      {items.length > limit && (
        <div className="calendar-event-more">외 {items.length - limit}개의 항목</div>
      )}
    </>
  )
}

export function CalendarCellSchedulePreview({
  date,
  items,
  colorMap,
}: {
  date: Dayjs
  items: Program[]
  colorMap: Map<string | number, ScheduleColorPair>
}) {
  return (
    <div className="calendar-cell-preview">
      {items.map(entity => {
        const { statusLabel } = getProgramDayScheduleLine(entity, date)
        const startTime =
          typeof (entity as { startTime?: unknown }).startTime === 'string'
            ? (entity as { startTime?: string }).startTime
            : undefined
        const time = startTime?.trim() ? startTime : '종일'
        const title = entity.title ?? ''
        const colorPair = resolveItemColor(
          calendarItemForScheduleSource(entity),
          colorMap,
          SCHEDULE_COLORS[0]
        )
        return (
          <button key={entity.id} type="button" className="calendar-cell-preview__item">
            <span className="calendar-cell-preview__title" style={{ color: colorPair.text }}>
              [{title}]
            </span>
            <span className="calendar-cell-preview__desc">
              {statusLabel} | {time}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function withOverlay(
  node: ReactElement,
  enabled: boolean,
  content: ReactNode,
  props: { tooltipOverlayClassName?: string }
) {
  if (!enabled) return node

  return (
    <ProgramCalendarOverlayFollowCursor
      variant="tooltip"
      tooltipOverlayClassName={props.tooltipOverlayClassName}
      content={content}
    >
      {node}
    </ProgramCalendarOverlayFollowCursor>
  )
}

export function buildEventsPreview(
  dayItems: CalendarItem[],
  colorMap: Map<string | number, ScheduleColorPair>,
  previewTooltipContent?: (args: {
    events: CalendarItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
) {
  return (previewTooltipContent ?? renderProgramApplicantPreviewTooltipContent)({
    events: dayItems,
    colorMap,
  })
}
