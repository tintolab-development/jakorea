import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import { EventOverlay } from '../overlay/EventOverlay'
import { EventList } from './EventList'
import { useDayEvents, type CalendarEventItem } from './useDayEvents'

interface EventMonthCellProps {
  date: Dayjs
  currentMonth: Dayjs
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

export function EventMonthCell(props: EventMonthCellProps) {
  const {
    date,
    currentMonth,
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

  const isCurrentMonth = date.isSame(currentMonth, 'month')
  const isSelected = date.isSame(selectedDate, 'day')
  const isToday = date.isSame(dayjs(), 'day')
  const { dayEvents, hasEvents, colorMap } = useDayEvents(
    events,
    date,
    buildResolvedColorMap,
    overrideEventColorMap
  )

  const cellClass = [
    'program-calendar-cell',
    !isCurrentMonth ? 'program-calendar-cell--other-month' : '',
    isSelected ? 'program-calendar-cell--selected' : '',
    isToday ? 'program-calendar-cell--today' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (!hasEvents) {
    return (
      <div className={cellClass} onClick={() => onSelectDate(date)}>
        <div className="program-calendar-cell-date">{date.date()}</div>
      </div>
    )
  }

  if (eventsTooltipTrigger === 'cell') {
    const cellInner = (
      <div className={cellClass} onClick={() => onSelectDate(date)}>
        <div className="program-calendar-cell-date">{date.date()}</div>
        <div className="program-calendar-cell-events">
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
          />
        </div>
      </div>
    )
    return (
      <EventOverlay
        scheduleOverlay={scheduleOverlay}
        tooltipOverlayClassName={tooltipOverlayClassName}
        previewContent={renderPreview(dayEvents, colorMap)}
      >
        <div className="program-calendar-cell-tooltip-trigger program-calendar-cell-tooltip-trigger--full-cell">
          {cellInner}
        </div>
      </EventOverlay>
    )
  }

  return (
    <div className={cellClass} onClick={() => onSelectDate(date)}>
      <div className="program-calendar-cell-date">{date.date()}</div>
      <div className="program-calendar-cell-events">
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
        />
      </div>
    </div>
  )
}

