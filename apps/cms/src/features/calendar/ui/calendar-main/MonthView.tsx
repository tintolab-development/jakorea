import { Calendar } from 'antd'
import type { ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import { ApplicantCalendarEventPopoverContent } from '@/features/program/program-detail/ui/applicant-list/applicant-calendar-schedule-helpers'
import { ProgramMonthCell } from '../program/ProgramMonthCell'
import { EventMonthCell } from '../event/EventMonthCell'
import type { CalendarMainEventItem } from './CalendarMain'
import { ProgramOverlayPreview } from '../program/ProgramOverlayPreview'

export type CalendarMainEventsConfig = {
  selectedRowKeys: React.Key[]
  renderEventsTooltipContent?: (args: {
    events: CalendarMainEventItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
  overrideEventColorMap?: (
    dayEvents: CalendarMainEventItem[]
  ) => Map<string | number, ScheduleColorPair>
  resolveEventColors?: (event: CalendarMainEventItem) => ScheduleColorPair | undefined
  eventsTooltipScope: 'trigger-only' | 'full-day'
  formatEventsOverflowText?: (hiddenCount: number) => string
  eventsTooltipTrigger: 'event-strip' | 'cell'
}

export function buildEventsPreview(
  dayEvents: CalendarMainEventItem[],
  colorMap: Map<string | number, ScheduleColorPair>,
  renderEventsTooltipContent?: (args: {
    events: CalendarMainEventItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
) {
  return renderEventsTooltipContent ? (
    renderEventsTooltipContent({ events: dayEvents, colorMap })
  ) : (
    <ApplicantCalendarEventPopoverContent events={dayEvents} colorMap={colorMap} />
  )
}

export { ProgramOverlayPreview as CalendarCellSchedulePreview }

interface MonthViewProps {
  currentMonth: Dayjs
  selectedDate: Dayjs
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
  programs?: Program[]
  events?: CalendarMainEventItem[]
  eventsConfig?: CalendarMainEventsConfig
  buildResolvedColorMap: (
    dayEvents: CalendarMainEventItem[]
  ) => Map<string | number, ScheduleColorPair>
}

export function MonthView({
  currentMonth,
  selectedDate,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
  programs,
  events,
  eventsConfig,
  buildResolvedColorMap,
}: MonthViewProps) {
  if (events != null && eventsConfig != null) {
    return (
      <Calendar
        fullscreen={false}
        value={currentMonth}
        headerRender={() => null}
        fullCellRender={date => (
          <EventMonthCell
            date={date}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            events={events}
            selectedRowKeys={eventsConfig.selectedRowKeys}
            onSelectDate={onSelectDate}
            scheduleOverlay={scheduleOverlay}
            tooltipOverlayClassName={tooltipOverlayClassName}
            resolveEventColors={eventsConfig.resolveEventColors}
            renderPreview={(list, map) =>
              buildEventsPreview(list, map, eventsConfig.renderEventsTooltipContent)
            }
            eventsTooltipScope={eventsConfig.eventsTooltipScope}
            formatEventsOverflowText={eventsConfig.formatEventsOverflowText}
            eventsTooltipTrigger={eventsConfig.eventsTooltipTrigger}
            overrideEventColorMap={eventsConfig.overrideEventColorMap}
            buildResolvedColorMap={buildResolvedColorMap}
          />
        )}
      />
    )
  }

  return (
    <Calendar
      fullscreen={false}
      value={currentMonth}
      headerRender={() => null}
      fullCellRender={date => (
        <ProgramMonthCell
          date={date}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          programs={programs ?? []}
          onSelectDate={onSelectDate}
          scheduleOverlay={scheduleOverlay}
          tooltipOverlayClassName={tooltipOverlayClassName}
        />
      )}
    />
  )
}

