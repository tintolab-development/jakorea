import type { Dayjs } from 'dayjs'
import type { ReactNode } from 'react'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import { EventOverlay } from '../overlay/EventOverlay'
import { EventList } from './EventList'
import { useDayEvents, type CalendarEventItem } from './useDayEvents'

interface EventWeekCellProps {
  date: Dayjs
  selectedDate: Dayjs
  events: CalendarEventItem[]
  selectedRowKeys: React.Key[]
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
  resolveEventColors?: (event: CalendarEventItem) => ScheduleColorPair | undefined
  renderPreview: (
    list: CalendarEventItem[],
    map: Map<string | number, ScheduleColorPair>
  ) => ReactNode
  eventsTooltipScope: 'trigger-only' | 'full-day'
  formatEventsOverflowText?: (hiddenCount: number) => string
  eventsTooltipTrigger: 'event-strip' | 'cell'
  overrideEventColorMap?: (
    dayEvents: CalendarEventItem[]
  ) => Map<string | number, ScheduleColorPair>
  buildResolvedColorMap: (
    dayEvents: CalendarEventItem[]
  ) => Map<string | number, ScheduleColorPair>
}

export function EventWeekCell(props: EventWeekCellProps) {
  const {
    date,
    selectedDate,
    events,
    selectedRowKeys,
    onSelectDate,
    scheduleOverlay,
    tooltipOverlayClassName,
    resolveEventColors,
    renderPreview,
    eventsTooltipScope,
    formatEventsOverflowText,
    eventsTooltipTrigger,
    overrideEventColorMap,
    buildResolvedColorMap,
  } = props

  const isSelected = date.isSame(selectedDate, 'day')
  const { dayEvents, hasEvents, colorMap } = useDayEvents(
    events,
    date,
    buildResolvedColorMap,
    overrideEventColorMap
  )

  if (!hasEvents) {
    return (
      <div
        className={`calendar-week-cell ${isSelected ? 'calendar-week-cell--selected' : ''}`}
        onClick={() => onSelectDate(date)}
      >
        <div
          className={`calendar-week-cell-date ${isSelected ? 'calendar-week-cell-date--selected' : ''}`}
        >
          {date.date()}
        </div>
      </div>
    )
  }

  if (eventsTooltipTrigger === 'cell') {
    const weekCellInnerPlain = (
      <>
        <div
          className={`calendar-week-cell-date ${isSelected ? 'calendar-week-cell-date--selected' : ''}`}
        >
          {date.date()}
        </div>
        <div className="calendar-week-cell-events">
          <EventList
            dayEvents={dayEvents}
            selectedRowKeys={selectedRowKeys}
            colorMap={colorMap}
            scheduleOverlay={scheduleOverlay}
            tooltipOverlayClassName={tooltipOverlayClassName}
            resolveEventColors={resolveEventColors}
            renderPreview={renderPreview}
            eventsTooltipScope={eventsTooltipScope}
            formatEventsOverflowText={formatEventsOverflowText}
            overrideEventColorMap={overrideEventColorMap}
            buildResolvedColorMap={buildResolvedColorMap}
            withWeekBorder
          />
        </div>
      </>
    )

    return (
      <div
        className={`calendar-week-cell ${isSelected ? 'calendar-week-cell--selected' : ''}`}
        onClick={() => onSelectDate(date)}
      >
        <EventOverlay
          scheduleOverlay={scheduleOverlay}
          tooltipOverlayClassName={tooltipOverlayClassName}
          previewContent={renderPreview(dayEvents, colorMap)}
        >
          <div className="calendar-week-cell-tooltip-trigger calendar-week-cell-tooltip-trigger--full-cell">
            {weekCellInnerPlain}
          </div>
        </EventOverlay>
      </div>
    )
  }

  return (
    <div
      className={`calendar-week-cell ${isSelected ? 'calendar-week-cell--selected' : ''}`}
      onClick={() => onSelectDate(date)}
    >
      <div
        className={`calendar-week-cell-date ${isSelected ? 'calendar-week-cell-date--selected' : ''}`}
      >
        {date.date()}
      </div>
      <div className="calendar-week-cell-events">
        <EventList
          dayEvents={dayEvents}
          selectedRowKeys={selectedRowKeys}
          colorMap={colorMap}
          scheduleOverlay={scheduleOverlay}
          tooltipOverlayClassName={tooltipOverlayClassName}
          resolveEventColors={resolveEventColors}
          renderPreview={renderPreview}
          eventsTooltipScope={eventsTooltipScope}
          formatEventsOverflowText={formatEventsOverflowText}
          overrideEventColorMap={overrideEventColorMap}
          buildResolvedColorMap={buildResolvedColorMap}
          withWeekBorder
        />
      </div>
    </div>
  )
}

