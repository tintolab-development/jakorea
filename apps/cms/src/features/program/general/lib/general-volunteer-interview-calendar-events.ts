import type { CalendarMainEventInput } from '@/shared/components/calendar'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import {
  GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS,
} from '@/features/program/general/lib/volunteer-screening-constants'
import {
  SECOND_INTERVIEW_SCREENING_STATUS_LABELS,
} from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-constants'
import { resolveGeneralEffectiveSecondInterviewStatus } from '@/features/program/general/lib/general-volunteer-interview2-display'
import {
  normalizeTimeRangeKey,
  parseInterviewDisplayDateLabel,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'
import { parseUjatInterviewDateLabel } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/shared/interview-calendar-events'

export type GeneralVolunteerInterviewCalendarEvent = CalendarMainEventInput & {
  originalItem: GeneralVolunteerApplicantRow
  slotLabel: string
  dateLabel: string
  volunteerName: string
  assignmentStatusLabel: string
}

function parseGeneralInterviewDateLabel(dateLabel: string) {
  return parseInterviewDisplayDateLabel(dateLabel) ?? parseUjatInterviewDateLabel(dateLabel)
}

function parseInterviewSlotRange(
  dateLabel: string,
  slot: string
): { startDate: string; endDate: string } | null {
  const parsedDate = parseGeneralInterviewDateLabel(dateLabel)
  if (!parsedDate) return null

  const normalized = normalizeTimeRangeKey(slot)
  const match = normalized.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)
  if (!match) return null

  const day = parsedDate.format('YYYY-MM-DD')
  return {
    startDate: `${day}T${match[1]}:00`,
    endDate: `${day}T${match[2]}:00`,
  }
}

/** 1차 서류 합격자 — 면접 가능 일정 기준 캘린더 이벤트 */
export function mapGeneralVolunteerInterviewAvailabilityToCalendarEvents(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerInterviewCalendarEvent[] {
  const events: GeneralVolunteerInterviewCalendarEvent[] = []

  for (const row of rows) {
    for (const day of row.interviewAvailability) {
      const parsedDate = parseGeneralInterviewDateLabel(day.dateLabel)
      if (!parsedDate) continue

      for (const slot of day.slots) {
        const range = parseInterviewSlotRange(day.dateLabel, slot)
        if (!range) continue

        const normalizedSlot = normalizeTimeRangeKey(slot)
        const timeMatch = normalizedSlot.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)

        events.push({
          id: `${row.id}|${day.dateLabel}|${normalizedSlot}`,
          title: `[봉사자] ${row.name}`,
          startDate: range.startDate,
          endDate: range.endDate,
          startTime: timeMatch?.[1],
          endTime: timeMatch?.[2],
          timeGridLabel: `${row.name} | ${normalizedSlot}`,
          originalItem: row,
          slotLabel: normalizedSlot,
          dateLabel: day.dateLabel,
          volunteerName: row.name,
          assignmentStatusLabel:
            GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS[row.interviewAssignmentStatus],
        })
      }
    }
  }

  return events
}

/** 면접일 배정 완료 봉사자 — 캘린더 이벤트 (배정일·시간 기준) */
export function mapGeneralVolunteerAssignedInterviewToCalendarEvents(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerInterviewCalendarEvent[] {
  const events: GeneralVolunteerInterviewCalendarEvent[] = []

  for (const row of rows) {
    if (row.interviewAssignmentStatus !== 'assigned') continue

    const dateLabel = row.assignedInterviewDateLabel
    const slot = row.assignedInterviewTime
    if (!dateLabel || !slot) continue

    const range = parseInterviewSlotRange(dateLabel, slot)
    if (!range) continue

    const normalizedSlot = normalizeTimeRangeKey(slot)
    const timeMatch = normalizedSlot.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)
    const effectiveStatus = resolveGeneralEffectiveSecondInterviewStatus(row)
    const statusLabel =
      effectiveStatus === 'withdrawn'
        ? GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS.withdrawn
        : SECOND_INTERVIEW_SCREENING_STATUS_LABELS[effectiveStatus]

    events.push({
      id: `${row.id}|${dateLabel}|${normalizedSlot}`,
      title: `[봉사자] ${row.name}`,
      startDate: range.startDate,
      endDate: range.endDate,
      startTime: timeMatch?.[1],
      endTime: timeMatch?.[2],
      timeGridLabel: `${row.name} | ${normalizedSlot}`,
      originalItem: row,
      slotLabel: normalizedSlot,
      dateLabel,
      volunteerName: row.name,
      assignmentStatusLabel: statusLabel,
    })
  }

  return events
}
