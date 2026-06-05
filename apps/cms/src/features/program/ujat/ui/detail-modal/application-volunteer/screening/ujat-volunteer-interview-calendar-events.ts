import dayjs from 'dayjs'
import type { CalendarMainEventInput } from '@/shared/components/calendar'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export type UjatVolunteerInterviewCalendarEvent = CalendarMainEventInput & {
  originalItem: UjatVolunteerApplicantRow
  slotLabel: string
  dateLabel: string
  volunteerName: string
  preferredRegion: string
  assignmentStatusLabel: string
}

export function parseUjatInterviewDateLabel(dateLabel: string): dayjs.Dayjs | null {
  const match = dateLabel.match(/(\d{2})\.\s*(\d{2})\.\s*(\d{2})/)
  if (!match) return null
  return dayjs(`20${match[1]}-${match[2]}-${match[3]}`)
}

export function parseUjatInterviewSlotRange(
  date: dayjs.Dayjs,
  slot: string
): { startDate: string; endDate: string } | null {
  const match = slot.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)
  if (!match) return null
  const day = date.format('YYYY-MM-DD')
  return {
    startDate: `${day}T${match[1]}:00`,
    endDate: `${day}T${match[2]}:00`,
  }
}

export function mapUjatVolunteerInterviewToCalendarEvents(
  rows: UjatVolunteerApplicantRow[]
): UjatVolunteerInterviewCalendarEvent[] {
  const events: UjatVolunteerInterviewCalendarEvent[] = []

  for (const row of rows) {
    for (const day of row.interviewAvailability) {
      const parsedDate = parseUjatInterviewDateLabel(day.dateLabel)
      if (!parsedDate) continue

      for (const slot of day.slots) {
        const range = parseUjatInterviewSlotRange(parsedDate, slot)
        if (!range) continue

        const id = `${row.id}|${day.dateLabel}|${slot}`
        const timeMatch = slot.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)
        events.push({
          id,
          title: `[봉사자] ${row.name} | ${row.preferredRegion}`,
          startDate: range.startDate,
          endDate: range.endDate,
          startTime: timeMatch?.[1],
          endTime: timeMatch?.[2],
          timeGridLabel: `${row.name} | ${slot}`,
          originalItem: row,
          slotLabel: slot,
          dateLabel: day.dateLabel,
          volunteerName: row.name,
          preferredRegion: row.preferredRegion,
          assignmentStatusLabel:
            UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS[row.interviewAssignmentStatus],
        })
      }
    }
  }

  return events
}
