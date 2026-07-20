import dayjs, { type Dayjs } from 'dayjs'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { getUjatEducationRegionSortOrderMap } from '@/features/program/ujat/lib/ujat-education-regions'
import {
  normalizeTimeRangeKey,
  parseInterviewDisplayDateLabel,
} from '../interview-assign/schedule-utils'

export type UjatEffectiveSecondInterviewStatus = UjatSecondInterviewScreeningStatus | 'withdrawn'

const MANUAL_SECOND_INTERVIEW_STATUSES = new Set<UjatSecondInterviewScreeningStatus>([
  'pass',
  'fail',
  'reserve1',
  'reserve2',
  'reserve3',
  'reserve4',
])

export const UJAT_INTERVIEW_TOTAL_SCORE_MIN = 1
export const UJAT_INTERVIEW_TOTAL_SCORE_MAX = 10
export const UJAT_INTERVIEW2_STATUS_POLL_MS = 60_000

export function computeUjatInterviewTotalScore(
  row: Pick<UjatVolunteerApplicantRow, 'managerAScore' | 'managerBScore'>
): number | null {
  const { managerAScore, managerBScore } = row
  if (managerAScore == null || managerBScore == null) return null

  const total = managerAScore + managerBScore
  if (total < UJAT_INTERVIEW_TOTAL_SCORE_MIN || total > UJAT_INTERVIEW_TOTAL_SCORE_MAX) {
    return null
  }

  return total
}

function parseUjatInterviewSlotEnd(
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

export function resolveUjatEffectiveSecondInterviewStatus(
  row: UjatVolunteerApplicantRow,
  now: Dayjs = dayjs()
): UjatEffectiveSecondInterviewStatus {
  if (row.interviewAssignmentStatus === 'withdrawn') return 'withdrawn'

  const stored = row.secondInterviewScreeningStatus
  if (stored && MANUAL_SECOND_INTERVIEW_STATUSES.has(stored)) return stored

  const slotEnd = parseUjatInterviewSlotEnd(row.assignedInterviewDateLabel, row.assignedInterviewTime)
  if (!slotEnd) return 'waiting'

  return now.isBefore(slotEnd) ? 'waiting' : 'completed'
}

export function matchesUjatInterview2ScoreFilter(
  totalScore: number | null,
  filter: string,
  allValue = 'ALL'
): boolean {
  if (filter === allValue) return true
  if (filter === 'empty') return totalScore == null
  return totalScore != null && String(totalScore) === filter
}

export function sortUjatVolunteerInterview2Rows(
  rows: UjatVolunteerApplicantRow[]
): UjatVolunteerApplicantRow[] {
  const regionOrder = getUjatEducationRegionSortOrderMap()

  return [...rows].sort((a, b) => {
    const scoreA = computeUjatInterviewTotalScore(a)
    const scoreB = computeUjatInterviewTotalScore(b)

    if (scoreA == null && scoreB != null) return 1
    if (scoreA != null && scoreB == null) return -1
    if (scoreA != null && scoreB != null && scoreA !== scoreB) return scoreB - scoreA

    const regionA = regionOrder[a.preferredRegion] ?? 99
    const regionB = regionOrder[b.preferredRegion] ?? 99
    if (regionA !== regionB) return regionA - regionB

    return a.no - b.no
  })
}
