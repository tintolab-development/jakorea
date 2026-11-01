import dayjs, { type Dayjs } from 'dayjs'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
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

function hasValidInterviewEvaluatorScore(score: number | null | undefined): boolean {
  return score != null && Number.isFinite(score)
}

/** 유효 점수 제출 평가자 수 < 2 — 합격·불합격 가드와 동일 */
export function isUjatInterviewTotalScoreUnevaluated(
  row: Pick<UjatVolunteerApplicantRow, 'managerAScore' | 'managerBScore'>
): boolean {
  let count = 0
  if (hasValidInterviewEvaluatorScore(row.managerAScore)) count += 1
  if (hasValidInterviewEvaluatorScore(row.managerBScore)) count += 1
  return count < 2
}

export function computeUjatInterviewTotalScore(
  row: Pick<UjatVolunteerApplicantRow, 'managerAScore' | 'managerBScore'>
): number | null {
  if (isUjatInterviewTotalScoreUnevaluated(row)) return null

  const total = (row.managerAScore ?? 0) + (row.managerBScore ?? 0)
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

function parseUjatInterviewSlotEndFromRow(
  row: Pick<
    UjatVolunteerApplicantRow,
    | 'assignedInterviewEndAt'
    | 'assignedInterviewStartAt'
    | 'assignedInterviewDateLabel'
    | 'assignedInterviewTime'
  >
): Dayjs | null {
  const endAt = row.assignedInterviewEndAt?.trim()
  if (endAt) {
    const end = dayjs(endAt)
    if (!end.isValid()) return null
    const startAt = row.assignedInterviewStartAt?.trim()
    if (startAt) {
      const start = dayjs(startAt)
      if (start.isValid() && !end.isAfter(start)) return null
    }
    return end
  }
  return parseUjatInterviewSlotEnd(row.assignedInterviewDateLabel, row.assignedInterviewTime)
}

export type UjatVolunteerInterview2ResultSelectRow = Pick<
  UjatVolunteerApplicantRow,
  | 'interviewAssignmentStatus'
  | 'secondInterviewScreeningStatus'
  | 'assignedInterviewDateLabel'
  | 'assignedInterviewTime'
  | 'assignedInterviewStartAt'
  | 'assignedInterviewEndAt'
  | 'managerAScore'
  | 'managerBScore'
>

export function resolveUjatEffectiveSecondInterviewStatus(
  row: UjatVolunteerInterview2ResultSelectRow,
  now: Dayjs = dayjs()
): UjatEffectiveSecondInterviewStatus {
  if (row.interviewAssignmentStatus === 'withdrawn') return 'withdrawn'

  const stored = row.secondInterviewScreeningStatus
  if (stored && MANUAL_SECOND_INTERVIEW_STATUSES.has(stored)) return stored

  const slotEnd = parseUjatInterviewSlotEndFromRow(row)
  if (!slotEnd) return 'waiting'

  return now.isBefore(slotEnd) ? 'waiting' : 'completed'
}

/** 선택 합격/불합격 가능 — 면접 종료·평가 완료·최종 결과 미입력 */
export function isUjatVolunteerInterview2EffectiveStatusSelectableForResult(
  status: UjatEffectiveSecondInterviewStatus
): boolean {
  if (status === 'withdrawn') return false
  if (
    status === 'pass' ||
    status === 'fail' ||
    status === 'reserve1' ||
    status === 'reserve2' ||
    status === 'reserve3' ||
    status === 'reserve4'
  ) {
    return false
  }
  return status === 'completed'
}

export function isUjatVolunteerInterview2SelectableForResult(
  row: UjatVolunteerInterview2ResultSelectRow
): boolean {
  if (isUjatInterviewTotalScoreUnevaluated(row)) return false
  return isUjatVolunteerInterview2EffectiveStatusSelectableForResult(
    resolveUjatEffectiveSecondInterviewStatus(row)
  )
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
