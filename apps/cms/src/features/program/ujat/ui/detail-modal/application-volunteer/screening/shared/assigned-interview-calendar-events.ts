import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { resolveSecondInterviewScreeningPopoverLabel } from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-ui'
import type { UjatVolunteerInterviewCalendarEvent } from './interview-calendar-events'
import {
  parseUjatInterviewDateLabel,
  parseUjatInterviewSlotRange,
} from './interview-calendar-events'
import { resolveUjatEffectiveSecondInterviewStatus } from '../interview2/display'

export function mapUjatVolunteerAssignedInterviewToCalendarEvents(
  rows: UjatVolunteerApplicantRow[]
): UjatVolunteerInterviewCalendarEvent[] {
  const events: UjatVolunteerInterviewCalendarEvent[] = []

  for (const row of rows) {
    const dateLabel = row.assignedInterviewDateLabel
    const slot = row.assignedInterviewTime
    if (!dateLabel || !slot) continue

    const parsedDate = parseUjatInterviewDateLabel(dateLabel)
    if (!parsedDate) continue

    const range = parseUjatInterviewSlotRange(parsedDate, slot)
    if (!range) continue

    const statusLabel = resolveSecondInterviewScreeningPopoverLabel(
      resolveUjatEffectiveSecondInterviewStatus(row)
    )

    events.push({
      id: `${row.id}|${dateLabel}|${slot}`,
      title: `[봉사자] ${row.name} | ${row.preferredRegion}`,
      startDate: range.startDate,
      endDate: range.endDate,
      originalItem: row,
      slotLabel: slot,
      dateLabel,
      volunteerName: row.name,
      preferredRegion: row.preferredRegion,
      assignmentStatusLabel: statusLabel,
    })
  }

  return events
}
