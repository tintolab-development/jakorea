import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { UJAT_SECOND_INTERVIEW_SCREENING_STATUS_LABELS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerInterviewCalendarEvent } from './ujat-volunteer-interview-calendar-events'
import {
  parseUjatInterviewDateLabel,
  parseUjatInterviewSlotRange,
} from './ujat-volunteer-interview-calendar-events'

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

    const status = row.secondInterviewScreeningStatus
    const statusLabel = status ? UJAT_SECOND_INTERVIEW_SCREENING_STATUS_LABELS[status] : ''

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
