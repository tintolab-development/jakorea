import dayjs, { type Dayjs } from 'dayjs'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { GeneralSecondInterviewScreeningStatus } from './volunteer-screening-constants'
import {
  normalizeTimeRangeKey,
  parseInterviewDisplayDateLabel,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-interview-assign-schedule-utils'
const FILTER_ALL = 'ALL'

const MANUAL_SECOND_INTERVIEW_STATUSES = new Set<GeneralSecondInterviewScreeningStatus>([
  'pass',
  'fail',
  'reserve1',
  'reserve2',
  'reserve3',
  'reserve4',
])

export type GeneralEffectiveSecondInterviewStatus =
  | GeneralSecondInterviewScreeningStatus
  | 'withdrawn'

export const GENERAL_INTERVIEW_TOTAL_SCORE_MIN = 1
export const GENERAL_INTERVIEW_TOTAL_SCORE_MAX = 10

export function computeGeneralInterviewTotalScore(
  row: Pick<GeneralVolunteerApplicantRow, 'managerAScore' | 'managerBScore'>
): number | null {
  const { managerAScore, managerBScore } = row
  if (managerAScore == null || managerBScore == null) return null

  const total = managerAScore + managerBScore
  if (total < GENERAL_INTERVIEW_TOTAL_SCORE_MIN || total > GENERAL_INTERVIEW_TOTAL_SCORE_MAX) {
    return null
  }

  return total
}

export function parseGeneralInterviewSlotEnd(
  dateLabel: string | undefined,
  timeRange: string | undefined
): Dayjs | null {
  if (!dateLabel || !timeRange) return null

  const date = parseInterviewDisplayDateLabel(dateLabel)
  if (!date) return null

  const normalized = normalizeTimeRangeKey(timeRange)
  const match = normalized.match(/(\d{2}):(\d{2})\s*~\s*(\d{2}):(\d{2})/)
  if (!match) return null

  return date
    .hour(Number(match[3]))
    .minute(Number(match[4]))
    .second(0)
    .millisecond(0)
}

export function resolveGeneralEffectiveSecondInterviewStatus(
  row: GeneralVolunteerApplicantRow,
  now: Dayjs = dayjs()
): GeneralEffectiveSecondInterviewStatus {
  if (row.interviewAssignmentStatus === 'withdrawn') return 'withdrawn'

  const stored = row.secondInterviewScreeningStatus
  if (stored && MANUAL_SECOND_INTERVIEW_STATUSES.has(stored)) return stored

  const slotEnd = parseGeneralInterviewSlotEnd(
    row.assignedInterviewDateLabel,
    row.assignedInterviewTime
  )
  if (!slotEnd) return 'waiting'

  return now.isBefore(slotEnd) ? 'waiting' : 'completed'
}

export function matchesGeneralInterview2ScoreFilter(
  totalScore: number | null,
  filter: string
): boolean {
  if (filter === FILTER_ALL) return true
  if (filter === 'empty') return totalScore == null
  return totalScore != null && String(totalScore) === filter
}

export function sortGeneralVolunteerInterview2Applicants(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return [...rows].sort((a, b) => {
    const scoreA = computeGeneralInterviewTotalScore(a)
    const scoreB = computeGeneralInterviewTotalScore(b)

    if (scoreA == null && scoreB == null) return b.no - a.no
    if (scoreA == null) return 1
    if (scoreB == null) return -1
    if (scoreA !== scoreB) return scoreB - scoreA
    return b.no - a.no
  })
}
