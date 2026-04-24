export type { CalendarEventsConfig, CalendarCellProps, CalendarCellEventModeProps } from './calendar-cell-types'
export { CalendarItemList, CalendarCellSchedulePreview, buildEventsPreview } from './calendar-cell-commons'

import { CalendarCellEventMode } from './calendar-cell-event-mode'
import { CalendarCellScheduleMode } from './calendar-cell-schedule-mode'
import type { CalendarCellEventModeProps, CalendarCellProps } from './calendar-cell-types'

export function CalendarCell(props: CalendarCellProps) {
  const isEventMode = props.eventsConfig && props.buildResolvedColorMap

  if (isEventMode) {
    return <CalendarCellEventMode {...(props as CalendarCellEventModeProps)} />
  }

  return <CalendarCellScheduleMode {...props} />
}
