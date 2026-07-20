import type { ReactNode } from 'react'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import type { SecondInterviewScreeningEffectiveStatus } from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-ui'
import {
  resolveSecondInterviewScreeningPopoverLabel,
  resolveSecondInterviewScreeningTone,
} from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-ui'
import '@/features/program/shared/ui/volunteer-screening/second-interview-screening-tone.css'
import {
  calendarItemsForEventMode,
  type CalendarItem,
} from '@/shared/components/calendar'
import type { UjatVolunteerInterviewCalendarEvent } from '../shared/interview-calendar-events'
import {
  resolveUjatEffectiveSecondInterviewStatus,
} from './display'
import './preview-tooltip.css'

function readScreeningStatus(
  event: UjatVolunteerInterviewCalendarEvent
): SecondInterviewScreeningEffectiveStatus {
  return resolveUjatEffectiveSecondInterviewStatus(event.originalItem)
}

function UjatVolunteerInterview2CalendarPopoverContent({
  events,
}: {
  events: UjatVolunteerInterviewCalendarEvent[]
}) {
  return (
    <div className="ujat-volunteer-interview2-calendar-popover">
      {events.map(ev => {
        const status = readScreeningStatus(ev)
        const tone = resolveSecondInterviewScreeningTone(status)
        return (
          <div key={ev.id} className="ujat-volunteer-interview2-calendar-popover__entry">
            <div className="ujat-volunteer-interview2-calendar-popover__head">
              <span className="ujat-volunteer-interview2-calendar-popover__name">
                {ev.volunteerName}
              </span>
              <span className="ujat-volunteer-interview2-calendar-popover__sep" aria-hidden>
                |
              </span>
              <span className="ujat-volunteer-interview2-calendar-popover__meta-slot">
                {ev.slotLabel}
              </span>
            </div>
            <div
              className={[
                'ujat-volunteer-interview2-calendar-popover__status',
                `second-interview-screening-tone--${tone}`,
              ].join(' ')}
            >
              {resolveSecondInterviewScreeningPopoverLabel(status)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function renderUjatVolunteerInterview2PreviewTooltipContent({
  events,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  const dayEvents = calendarItemsForEventMode(events).map(
    item => item.original as UjatVolunteerInterviewCalendarEvent
  )

  return <UjatVolunteerInterview2CalendarPopoverContent events={dayEvents} />
}
