import type { ReactNode } from 'react'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import {
  calendarItemsForEventMode,
  type CalendarItem,
} from '@/shared/components/calendar'
import type { GeneralVolunteerInterviewCalendarEvent } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import {
  formatUjatInterview2ScoreLabel,
  ujatInterview2ScreeningPopoverLabel,
  ujatInterview2ScreeningTone,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview2-screening-ui'
import '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview2-preview-tooltip.css'

function readScreeningStatus(
  event: GeneralVolunteerInterviewCalendarEvent
): GeneralSecondInterviewScreeningStatus {
  return event.originalItem.secondInterviewScreeningStatus ?? 'waiting'
}

function GeneralVolunteerInterviewCalendarPopoverContent({
  events,
}: {
  events: GeneralVolunteerInterviewCalendarEvent[]
}) {
  return (
    <div className="ujat-volunteer-interview2-calendar-popover">
      {events.map(ev => {
        const status = readScreeningStatus(ev)
        const tone = ujatInterview2ScreeningTone(
          status as Parameters<typeof ujatInterview2ScreeningTone>[0]
        )
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
                {ujatInterview2ScreeningPopoverLabel(
                  status as Parameters<typeof ujatInterview2ScreeningPopoverLabel>[0]
                )}
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

export function renderGeneralVolunteerInterviewCalendarPreviewTooltipContent({
  events,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  const dayEvents = calendarItemsForEventMode(events).map(
    item => item.original as GeneralVolunteerInterviewCalendarEvent
  )

  return <GeneralVolunteerInterviewCalendarPopoverContent events={dayEvents} />
}
