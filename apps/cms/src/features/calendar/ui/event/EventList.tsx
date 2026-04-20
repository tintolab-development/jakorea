import { Fragment } from 'react'
import type { ReactNode } from 'react'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import { SCHEDULE_COLORS } from '@/features/program/ui/program-schedule-colors'
import type { CalendarEventItem } from './useDayEvents'
import { EventOverlay } from '../overlay/EventOverlay'

interface EventListProps {
  dayEvents: CalendarEventItem[]
  selectedRowKeys: React.Key[]
  colorMap: Map<string | number, ScheduleColorPair>
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
  resolveEventColors?: (event: CalendarEventItem) => ScheduleColorPair | undefined
  renderPreview: (
    list: CalendarEventItem[],
    map: Map<string | number, ScheduleColorPair>
  ) => ReactNode
  eventsTooltipScope: 'trigger-only' | 'full-day'
  formatEventsOverflowText?: (hiddenCount: number) => string
  overrideEventColorMap?: (
    dayEvents: CalendarEventItem[]
  ) => Map<string | number, ScheduleColorPair>
  buildResolvedColorMap: (
    dayEvents: CalendarEventItem[]
  ) => Map<string | number, ScheduleColorPair>
  withWeekBorder?: boolean
}

export function EventList({
  dayEvents,
  selectedRowKeys,
  colorMap,
  scheduleOverlay,
  tooltipOverlayClassName,
  resolveEventColors,
  renderPreview,
  eventsTooltipScope,
  formatEventsOverflowText,
  overrideEventColorMap,
  buildResolvedColorMap,
  withWeekBorder = false,
}: EventListProps) {
  return (
    <>
      {dayEvents.slice(0, 2).map(event => {
        const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
        const isEventSelected = selectedRowKeys.includes(event.id)
        const colors = resolveEventColors?.(event) ?? colorMap.get(event.id) ?? SCHEDULE_COLORS[0]
        const tooltipList = eventsTooltipScope === 'full-day' ? dayEvents : [event]
        const tooltipColorMap =
          overrideEventColorMap != null
            ? overrideEventColorMap(eventsTooltipScope === 'full-day' ? dayEvents : [event])
            : buildResolvedColorMap(tooltipList)
        const previewOne = renderPreview(tooltipList, tooltipColorMap)

        return (
          <Fragment key={String(event.id)}>
            <EventOverlay
              scheduleOverlay={scheduleOverlay}
              tooltipOverlayClassName={tooltipOverlayClassName}
              previewContent={previewOne}
            >
              <div className="calendar-event-tooltip-trigger">
                <div
                  className={`calendar-event ${isEventSelected ? 'calendar-event--selected' : ''}`}
                  style={{
                    backgroundColor: colors.bg,
                    border: withWeekBorder
                      ? isEventSelected
                        ? 'none'
                        : `1px solid ${colors.border}`
                      : undefined,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <span className="calendar-event-title" style={{ color: colors.text }}>
                    {displayTitle}
                  </span>
                </div>
              </div>
            </EventOverlay>
          </Fragment>
        )
      })}
      {dayEvents.length > 2 && (
        <Fragment key="more">
          <EventOverlay
            scheduleOverlay={scheduleOverlay}
            tooltipOverlayClassName={tooltipOverlayClassName}
            previewContent={(() => {
              const moreList = eventsTooltipScope === 'full-day' ? dayEvents : dayEvents.slice(2)
              const moreColorMap =
                overrideEventColorMap != null
                  ? overrideEventColorMap(moreList)
                  : buildResolvedColorMap(moreList)
              return renderPreview(moreList, moreColorMap)
            })()}
          >
            <div className="calendar-event-tooltip-trigger calendar-event-more">
              {formatEventsOverflowText?.(dayEvents.length - 2) ?? `외 ${dayEvents.length - 2}개의 항목`}
            </div>
          </EventOverlay>
        </Fragment>
      )}
    </>
  )
}

