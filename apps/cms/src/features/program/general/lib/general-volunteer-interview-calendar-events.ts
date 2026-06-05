import type { CalendarMainEventInput } from '@/shared/components/calendar'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_LABELS } from '@/features/program/general/lib/volunteer-screening-constants'
import {
  normalizeTimeRangeKey,
  parseInterviewDisplayDateLabel,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-interview-assign-schedule-utils'

export type GeneralVolunteerInterviewCalendarEvent = CalendarMainEventInput & {
  originalItem: GeneralVolunteerApplicantRow
  slotLabel: string
  dateLabel: string
  volunteerName: string
  assignmentStatusLabel: string
}

function parseAssignedInterviewSlotRange(
  dateLabel: string,
  slot: string
): { startDate: string; endDate: string } | null {
  const parsedDate = parseInterviewDisplayDateLabel(dateLabel)
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

    const range = parseAssignedInterviewSlotRange(dateLabel, slot)
    if (!range) continue

    const normalizedSlot = normalizeTimeRangeKey(slot)
    const timeMatch = normalizedSlot.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)
    const status = row.secondInterviewScreeningStatus
    const statusLabel = status ? GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_LABELS[status] : ''

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
