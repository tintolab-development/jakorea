import type { ReactNode } from 'react'
import type { UjatSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import {
  calendarItemsForEventMode,
  type CalendarItem,
} from '@/shared/components/calendar'
import type { UjatVolunteerInterviewCalendarEvent } from './ujat-volunteer-interview-calendar-events'
import {
  formatUjatInterview2ScoreLabel,
  ujatInterview2ScreeningPopoverLabel,
  ujatInterview2ScreeningTone,
} from './ujat-volunteer-interview2-screening-ui'
import './ujat-volunteer-interview2-preview-tooltip.css'

function readScreeningStatus(
  event: UjatVolunteerInterviewCalendarEvent
): UjatSecondInterviewScreeningStatus {
  return event.originalItem.secondInterviewScreeningStatus ?? 'waiting'
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
        const tone = ujatInterview2ScreeningTone(status)
        return (
          <div key={ev.id} className="ujat-volunteer-interview2-calendar-popover__entry">
            <div className="ujat-volunteer-interview2-calendar-popover__head">
              <span className="ujat-volunteer-interview2-calendar-popover__name">
                {ev.volunteerName}
              </span>
              <span className="ujat-volunteer-interview2-calendar-popover__sep" aria-hidden>
                |
              </span>
              <span
                className={`ujat-volunteer-interview2-calendar-popover__status ujat-volunteer-interview2-calendar-popover__status--${tone}`}
              >
                {ujatInterview2ScreeningPopoverLabel(status)}
              </span>
            </div>
            <div className="ujat-volunteer-interview2-calendar-popover__meta">
              <span className="ujat-volunteer-interview2-calendar-popover__meta-slot">
                {ev.slotLabel}
              </span>
              <span className="ujat-volunteer-interview2-calendar-popover__sep" aria-hidden>
                |
              </span>
              <span className="ujat-volunteer-interview2-calendar-popover__meta-score">
                {formatUjatInterview2ScoreLabel(ev.originalItem.totalScore)}
              </span>
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
