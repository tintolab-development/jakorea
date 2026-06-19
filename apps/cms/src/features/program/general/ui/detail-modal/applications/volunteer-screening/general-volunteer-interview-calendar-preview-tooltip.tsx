import type { ReactNode } from 'react'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import {
  calendarItemsForEventMode,
  type CalendarItem,
} from '@/shared/components/calendar'
import type { GeneralVolunteerInterviewCalendarEvent } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/preview-tooltip.css'
import './general-volunteer-doc-passed-calendar-popover.css'

type DocPassedCalendarPopoverGroup = {
  volunteerName: string
  slots: string[]
  representativeId: string
  interviewSlotCount: number
}

function groupDocPassedCalendarDayEvents(
  events: GeneralVolunteerInterviewCalendarEvent[]
): DocPassedCalendarPopoverGroup[] {
  const grouped = new Map<
    string,
    DocPassedCalendarPopoverGroup & { slotSet: Set<string> }
  >()

  for (const event of events) {
    const key = event.volunteerName.trim()
    if (!key) continue

    let group = grouped.get(key)
    if (!group) {
      group = {
        volunteerName: key,
        slots: [],
        representativeId: String(event.id),
        interviewSlotCount: event.originalItem.interviewSlotCount,
        slotSet: new Set<string>(),
      }
      grouped.set(key, group)
    }

    const slot = event.slotLabel.trim()
    if (slot && !group.slotSet.has(slot)) {
      group.slotSet.add(slot)
      group.slots.push(slot)
    }
  }

  return Array.from(grouped.values()).map(
    ({ volunteerName, slots, representativeId, interviewSlotCount }) => ({
      volunteerName,
      slots,
      representativeId,
      interviewSlotCount,
    })
  )
}

function resolveVolunteerAccentColor(
  representativeId: string,
  colorMap: Map<string | number, ScheduleColorPair>
): string {
  return colorMap.get(representativeId)?.text ?? SCHEDULE_COLORS[0].text
}

function formatDaySlotSummary(slots: string[]): string {
  const primarySlot = slots[0] ?? ''
  const extraCount = slots.length - 1
  if (!primarySlot) return ''
  return extraCount > 0 ? `${primarySlot} 외 ${extraCount}개` : primarySlot
}

function GeneralDocPassedCalendarPopoverContent({
  groups,
  colorMap,
}: {
  groups: DocPassedCalendarPopoverGroup[]
  colorMap: Map<string | number, ScheduleColorPair>
}) {
  return (
    <div className="ujat-volunteer-interview-calendar-popover">
      {groups.map(group => {
        const nameColor = resolveVolunteerAccentColor(group.representativeId, colorMap)
        const timeSummary = formatDaySlotSummary(group.slots)

        return (
          <div
            key={`${group.volunteerName}-${group.representativeId}`}
            className="ujat-volunteer-interview-calendar-popover__entry"
          >
            <div className="ujat-volunteer-interview-calendar-popover__head">
              <span
                className="ujat-volunteer-interview-calendar-popover__name general-volunteer-doc-passed-calendar-popover__name"
                style={{ color: nameColor }}
              >
                {group.volunteerName}
              </span>
              <span className="ujat-volunteer-interview-calendar-popover__sep" aria-hidden>
                |
              </span>
              <span className="general-volunteer-doc-passed-calendar-popover__time-range">
                {timeSummary}
              </span>
            </div>
            <div className="general-volunteer-doc-passed-calendar-popover__availability-count">
              면접 가능 일정 수 : {group.interviewSlotCount}개
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function renderGeneralVolunteerInterviewCalendarPreviewTooltipContent({
  events,
  colorMap,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  const dayEvents = calendarItemsForEventMode(events).map(
    item => item.original as GeneralVolunteerInterviewCalendarEvent
  )
  const groups = groupDocPassedCalendarDayEvents(dayEvents)

  return <GeneralDocPassedCalendarPopoverContent groups={groups} colorMap={colorMap} />
}
