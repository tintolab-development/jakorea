import type { ReactNode } from 'react'
import type { GeneralVolunteerInterviewCalendarEvent } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import { resolveGeneralEffectiveSecondInterviewStatus } from '@/features/program/general/lib/general-volunteer-interview2-display'
import {
  resolveSecondInterviewScreeningListBadgeLabel,
  resolveSecondInterviewScreeningPopoverLabel,
  resolveSecondInterviewScreeningTone,
} from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-ui'
import '@/features/program/shared/ui/volunteer-screening/second-interview-screening-tone.css'
import {
  calendarItemsForEventMode,
  type CalendarItem,
} from '@/shared/components/calendar'
import './general-volunteer-interview2-preview-tooltip.css'

function GeneralVolunteerInterview2CalendarPopoverContent({
  events,
  shortStatusLabels = false,
}: {
  events: GeneralVolunteerInterviewCalendarEvent[]
  /** 봉사자 시안 10-2(3491:144291) — 진행 대기·불합격 등 짧은 라벨 */
  shortStatusLabels?: boolean
}) {
  return (
    <div className="general-volunteer-interview2-calendar-popover">
      {events.map(ev => {
        const status = resolveGeneralEffectiveSecondInterviewStatus(ev.originalItem)
        const tone = resolveSecondInterviewScreeningTone(status)
        return (
          <div key={ev.id} className="general-volunteer-interview2-calendar-popover__entry">
            <div className="general-volunteer-interview2-calendar-popover__head">
              <span className="general-volunteer-interview2-calendar-popover__name">
                {ev.volunteerName}
              </span>
              <span className="general-volunteer-interview2-calendar-popover__sep" aria-hidden>
                |
              </span>
              <span className="general-volunteer-interview2-calendar-popover__slot">
                {ev.slotLabel}
              </span>
            </div>
            <div
              className={[
                'second-interview-screening-popover-status',
                `second-interview-screening-tone--${tone}`,
              ].join(' ')}
            >
              {shortStatusLabels
                ? resolveSecondInterviewScreeningListBadgeLabel(status)
                : resolveSecondInterviewScreeningPopoverLabel(status)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function renderGeneralVolunteerInterview2PreviewTooltipContent({
  events,
}: {
  events: CalendarItem[]
}): ReactNode {
  const dayEvents = calendarItemsForEventMode(events).map(
    item => item.original as GeneralVolunteerInterviewCalendarEvent
  )

  return <GeneralVolunteerInterview2CalendarPopoverContent events={dayEvents} />
}

/** 봉사자 시안 10-2 — 팝오버 상태를 우측 카드와 같은 짧은 라벨로 */
export function renderGeneralVolunteerInterview2ShortLabelPreviewTooltipContent({
  events,
}: {
  events: CalendarItem[]
}): ReactNode {
  const dayEvents = calendarItemsForEventMode(events).map(
    item => item.original as GeneralVolunteerInterviewCalendarEvent
  )

  return <GeneralVolunteerInterview2CalendarPopoverContent events={dayEvents} shortStatusLabels />
}
