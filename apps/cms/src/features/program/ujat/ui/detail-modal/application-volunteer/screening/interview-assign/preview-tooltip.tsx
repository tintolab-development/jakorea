import type { ReactNode } from 'react'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import {
  calendarItemsForEventMode,
  type CalendarItem,
} from '@/shared/components/calendar'
import type { UjatVolunteerInterviewCalendarEvent } from '../shared/interview-calendar-events'
import { formatUjatInterviewSlotSummary } from '../shared/interview-calendar-events'
import './preview-tooltip.css'

type VolunteerPopoverGroup = {
  volunteerName: string
  slots: string[]
  representativeId: string
  totalSlotCount: number
}

function groupVolunteerInterviewDayEvents(
  events: UjatVolunteerInterviewCalendarEvent[]
): VolunteerPopoverGroup[] {
  const grouped = new Map<string, VolunteerPopoverGroup & { slotSet: Set<string> }>()

  for (const ev of events) {
    const key = ev.volunteerName.trim()
    if (!key) continue

    let group = grouped.get(key)
    if (!group) {
      group = {
        volunteerName: key,
        slots: [],
        representativeId: String(ev.id),
        totalSlotCount: ev.originalItem.interviewSlotCount,
        slotSet: new Set<string>(),
      }
      grouped.set(key, group)
    }

    const slot = ev.slotLabel.trim()
    if (slot && !group.slotSet.has(slot)) {
      group.slotSet.add(slot)
      group.slots.push(slot)
    }
  }

  return Array.from(grouped.values()).map(
    ({ volunteerName, slots, representativeId, totalSlotCount }) => ({
      volunteerName,
      slots,
      representativeId,
      totalSlotCount,
    })
  )
}

function resolveVolunteerAccentColor(
  representativeId: string,
  colorMap: Map<string | number, ScheduleColorPair>
): string {
  return colorMap.get(representativeId)?.text ?? SCHEDULE_COLORS[0].text
}

function UjatVolunteerCalendarEventPopoverContent({
  groups,
  colorMap,
}: {
  groups: VolunteerPopoverGroup[]
  colorMap: Map<string | number, ScheduleColorPair>
}) {
  return (
    <div className="ujat-volunteer-interview-calendar-popover">
      {groups.map(group => {
        const nameColor = resolveVolunteerAccentColor(group.representativeId, colorMap)
        const slotSummary = formatUjatInterviewSlotSummary(group.slots)
        return (
          <div
            key={`${group.volunteerName}-${group.representativeId}`}
            className="ujat-volunteer-interview-calendar-popover__entry"
          >
            <div className="ujat-volunteer-interview-calendar-popover__head">
              <span
                className="ujat-volunteer-interview-calendar-popover__name"
                style={{ color: nameColor }}
              >
                {group.volunteerName}
              </span>
              <span className="ujat-volunteer-interview-calendar-popover__sep" aria-hidden>
                |
              </span>
              <span className="ujat-volunteer-interview-calendar-popover__meta">
                {slotSummary}
              </span>
            </div>
            <div className="ujat-volunteer-interview-calendar-popover__schedule-count">
              면접 가능 일정 수 : {group.totalSlotCount}개
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function renderUjatVolunteerInterviewPreviewTooltipContent({
  events,
  colorMap,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  const dayEvents = calendarItemsForEventMode(events).map(
    item => item.original as UjatVolunteerInterviewCalendarEvent
  )
  const groups = groupVolunteerInterviewDayEvents(dayEvents)

  return <UjatVolunteerCalendarEventPopoverContent groups={groups} colorMap={colorMap} />
}
