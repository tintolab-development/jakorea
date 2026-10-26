import { type Key, type ReactElement, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import { getProgramDayScheduleLine } from '@/entities/program/lib/program-day-schedule-line'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import { resolveItemColor, type CalendarItem } from '../lib/calendar-helpers'
import '../styles/calendar-preview-popover-content.css'
import { CalendarPreviewTooltip } from './preview-tooltip/calendar-preview-tooltip'
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
}: {
  date: Dayjs
  items: Program[]
  colorMap: Map<string | number, ScheduleColorPair>
}) {
  return (
    <div className="calendar-preview-popover">
      {items.map(entity => {
        const { statusLabel, time } = getProgramDayScheduleLine(entity, date)
        const title = entity.title ?? ''
        return (
          <div
            key={entity.id}
            className="calendar-preview-popover__entry"
          >
            <span className="calendar-preview-popover__title">[{title}]</span>
            <div className="calendar-preview-popover__meta">
              <span className="calendar-preview-popover__meta-part">
                {statusLabel}
              </span>
              <span className="calendar-preview-popover__meta-sep" aria-hidden />
              <span className="calendar-preview-popover__meta-part">
                {time}
              </span>
            </div>
          </div>
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
  if (!enabled || content == null) return node
  return (
    <CalendarPreviewTooltip
      enabled
      content={content}
      tooltipOverlayClassName={props.tooltipOverlayClassName}
    >
      {node}
    </CalendarPreviewTooltip>
  )
}

export function buildEventsPreview(
  dayItems: CalendarItem[],
  colorMap: Map<string | number, ScheduleColorPair>,
  previewTooltipContent?: (args: {
    events: CalendarItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
): ReactNode {
  if (previewTooltipContent == null) return null
  return previewTooltipContent({ events: dayItems, colorMap })
}
