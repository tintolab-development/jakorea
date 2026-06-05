import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import {
  normalizeTimeRangeKey,
  parseInterviewDisplayDateLabel,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-interview-assign-schedule-utils'
import { parseUjatInterviewDateLabel } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview-calendar-events'

function parseInterviewDateLabel(label: string) {
  return parseUjatInterviewDateLabel(label) ?? parseInterviewDisplayDateLabel(label)
}

function dateLabelsMatch(a: string, b: string): boolean {
  const da = parseInterviewDateLabel(a)
  const db = parseInterviewDateLabel(b)
  if (da && db) return da.isSame(db, 'day')
  return a === b
}

export function isAssignedInterviewSlot(
  applicant: GeneralVolunteerApplicantRow,
  dateLabel: string,
  slot: string
): boolean {
  if (applicant.interviewAssignmentStatus !== 'assigned') return false
  if (!applicant.assignedInterviewDateLabel || !applicant.assignedInterviewTime) return false
  if (!dateLabelsMatch(applicant.assignedInterviewDateLabel, dateLabel)) return false
  return normalizeTimeRangeKey(applicant.assignedInterviewTime) === normalizeTimeRangeKey(slot)
}
