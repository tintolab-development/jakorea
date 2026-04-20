import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import { ProgramWeekCell } from '../program/ProgramWeekCell'
import { EventWeekCell } from '../event/EventWeekCell'
import type { CalendarMainEventItem } from './CalendarMain'
import { buildEventsPreview, type CalendarMainEventsConfig } from './MonthView'

interface WeekViewProps {
  weekDates: Dayjs[]
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

export function WeekView({
  weekDates,
  selectedDate,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
  programs,
  events,
  eventsConfig,
  buildResolvedColorMap,
}: WeekViewProps) {
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const isEventsMode = events != null && eventsConfig != null

  return (
    <div className="program-calendar-week">
      <div className="program-calendar-week-header">
        {weekdayNames.map(day => (
          <div key={day} className="program-calendar-week-header-cell">
            {day}
          </div>
        ))}
      </div>
      <div className="program-calendar-week-body">
        {weekDates.map(date =>
          isEventsMode ? (
            <EventWeekCell
              key={date.format('YYYY-MM-DD')}
              date={date}
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
          ) : (
            <ProgramWeekCell
              key={date.format('YYYY-MM-DD')}
              date={date}
              selectedDate={selectedDate}
              programs={programs ?? []}
              onSelectDate={onSelectDate}
              scheduleOverlay={scheduleOverlay}
              tooltipOverlayClassName={tooltipOverlayClassName}
            />
          )
        )}
      </div>
    </div>
  )
}

