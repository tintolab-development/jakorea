import dayjs, { type Dayjs } from 'dayjs'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import type { GeneralSecondInterviewScreeningStatus } from './volunteer-screening-constants'
import {
  normalizeTimeRangeKey,
  parseInterviewDisplayDateLabel,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'
const FILTER_ALL = 'ALL'

/** 합격·불합격·예비 — 면접 종료 시각과 무관하게 저장값 우선 */
export const GENERAL_MANUAL_SECOND_INTERVIEW_SCREENING_STATUSES =
  new Set<GeneralSecondInterviewScreeningStatus>([
    'pass',
    'fail',
    'reserve1',
    'reserve2',
    'reserve3',
    'reserve4',
  ])

const MANUAL_SECOND_INTERVIEW_STATUSES = GENERAL_MANUAL_SECOND_INTERVIEW_SCREENING_STATUSES

/** 자동 상태 전환 폴링 — 전환 예정 없을 때 최대 간격(ms) */
export const GENERAL_INTERVIEW2_STATUS_POLL_MS = 60_000

const MIN_STATUS_TRANSITION_DELAY_MS = 1_000

export type GeneralEffectiveSecondInterviewStatus =
  | GeneralSecondInterviewScreeningStatus
  | 'withdrawn'

export const GENERAL_INTERVIEW_TOTAL_SCORE_MIN = 1
export const GENERAL_INTERVIEW_TOTAL_SCORE_MAX = 10
/** 담당자 A·B 각각. 두 점수의 합이 총합 상한(10)을 넘지 않도록 5로 둔다. */
export const GENERAL_INTERVIEW_MANAGER_SCORE_MAX = 5
/** 면접 평가 UI 셀렉트 — 1~5 (BE 일반 프로그램은 0~5 허용, UI는 1~5 + 미평가) */
export const GENERAL_INTERVIEW_MANAGER_SCORE_MIN = 1

export const GENERAL_INTERVIEW_MANAGER_SCORE_UNEVALUATED_SELECT_VALUE =
  '__general_interview_manager_score_unevaluated__'

export const GENERAL_INTERVIEW_MANAGER_SCORE_SELECT_OPTIONS: ReadonlyArray<{
  label: string
  value: string
}> = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  {
    label: '미평가',
    value: GENERAL_INTERVIEW_MANAGER_SCORE_UNEVALUATED_SELECT_VALUE,
  },
]

export function normalizeGeneralInterviewManagerScore(
  score: number | null | undefined
): number | null {
  if (score == null || !Number.isFinite(score)) return null
  const next = Math.trunc(score)
  if (next < GENERAL_INTERVIEW_MANAGER_SCORE_MIN || next > GENERAL_INTERVIEW_MANAGER_SCORE_MAX) {
    return null
  }
  return next
}

export function generalInterviewManagerScoreToSelectValue(
  score: number | null | undefined
): string {
  const normalized = normalizeGeneralInterviewManagerScore(score)
  if (normalized == null) return GENERAL_INTERVIEW_MANAGER_SCORE_UNEVALUATED_SELECT_VALUE
  return String(normalized)
}

export function generalInterviewManagerScoreFromSelectValue(
  value: string | undefined | null
): number | null {
  if (!value || value === GENERAL_INTERVIEW_MANAGER_SCORE_UNEVALUATED_SELECT_VALUE) return null
  return normalizeGeneralInterviewManagerScore(Number(value))
}

export function formatGeneralInterviewManagerScoreDisplay(
  score: number | null | undefined
): string {
  if (score == null || !Number.isFinite(score)) return '미평가'
  const next = Math.trunc(score)
  if (next === 0) return '0'
  if (next >= GENERAL_INTERVIEW_MANAGER_SCORE_MIN && next <= GENERAL_INTERVIEW_MANAGER_SCORE_MAX) {
    return String(next)
  }
  return '미평가'
}

/** 배정 면접 일정 — `2026.03.30(목) 09:00 ~ 09:30` */
export function formatGeneralAssignedInterviewScheduleDisplay(
  row: Pick<GeneralVolunteerApplicantRow, 'assignedInterviewDateLabel' | 'assignedInterviewTime'>
): string {
  const dateLabel = row.assignedInterviewDateLabel?.trim()
  const timeRange = row.assignedInterviewTime?.trim()
  if (!dateLabel || !timeRange) return '-'

  const date = parseInterviewDisplayDateLabel(dateLabel)
  const slot = normalizeTimeRangeKey(timeRange)
  if (!date) return `${dateLabel} ${slot}`

  const datePart = formatDateDotWithWeekday(date)
  return datePart === '-' ? `${dateLabel} ${slot}` : `${datePart} ${slot}`
}

function hasValidInterviewEvaluatorScore(score: number | null | undefined): boolean {
  return score != null && Number.isFinite(score)
}

/** BE `totalScoreUnevaluated`와 동일 — 유효 score 제출 평가자 수 < 2 */
export function isGeneralInterviewTotalScoreUnevaluated(
  row: Pick<GeneralVolunteerApplicantRow, 'managerAScore' | 'managerBScore'>
): boolean {
  let count = 0
  if (hasValidInterviewEvaluatorScore(row.managerAScore)) count += 1
  if (hasValidInterviewEvaluatorScore(row.managerBScore)) count += 1
  return count < 2
}

/** 목록·필터 총점 — 미평가면 null(`-`), 양쪽 제출(0점 포함)이면 합산 */
export function computeGeneralInterviewTotalScore(
  row: Pick<GeneralVolunteerApplicantRow, 'managerAScore' | 'managerBScore'>
): number | null {
  if (isGeneralInterviewTotalScoreUnevaluated(row)) return null
  return (row.managerAScore ?? 0) + (row.managerBScore ?? 0)
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

/** BE `assignedInterviewEndAt` 우선, 없으면 표시 문자열 파싱 */
export function parseGeneralInterviewSlotEndFromRow(
  row: Pick<
    GeneralVolunteerApplicantRow,
    | 'assignedInterviewEndAt'
    | 'assignedInterviewStartAt'
    | 'assignedInterviewDateLabel'
    | 'assignedInterviewTime'
  >
): Dayjs | null {
  const endAt = row.assignedInterviewEndAt?.trim()
  if (endAt) {
    const parsed = dayjs(endAt)
    if (!parsed.isValid()) return null
    const startAt = row.assignedInterviewStartAt?.trim()
    if (startAt) {
      const start = dayjs(startAt)
      if (start.isValid() && !parsed.isAfter(start)) return null
    }
    return parsed
  }
  return parseGeneralInterviewSlotEnd(row.assignedInterviewDateLabel, row.assignedInterviewTime)
}

export function isGeneralAutoDerivedSecondInterviewStatus(
  row: Pick<
    GeneralVolunteerApplicantRow,
    'interviewAssignmentStatus' | 'secondInterviewScreeningStatus'
  >
): boolean {
  if (row.interviewAssignmentStatus === 'withdrawn') return false
  const stored = row.secondInterviewScreeningStatus
  return !stored || !MANUAL_SECOND_INTERVIEW_STATUSES.has(stored)
}

/**
 * 다음 자동 상태 전환(대기→완료)까지 대기 ms.
 * 전환 예정 행이 없으면 `GENERAL_INTERVIEW2_STATUS_POLL_MS`.
 */
export function getGeneralInterview2NextStatusTransitionDelayMs(
  rows: GeneralVolunteerApplicantRow[],
  now: Dayjs = dayjs()
): number {
  const nowMs = now.valueOf()
  let minDelay: number | null = null

  for (const row of rows) {
    if (!isGeneralAutoDerivedSecondInterviewStatus(row)) continue

    const slotEnd = parseGeneralInterviewSlotEndFromRow(row)
    if (!slotEnd) continue

    const delay = slotEnd.valueOf() - nowMs
    if (delay <= 0) continue

    if (minDelay == null || delay < minDelay) {
      minDelay = delay
    }
  }

  if (minDelay == null) return GENERAL_INTERVIEW2_STATUS_POLL_MS
  return Math.max(
    MIN_STATUS_TRANSITION_DELAY_MS,
    Math.min(minDelay, GENERAL_INTERVIEW2_STATUS_POLL_MS)
  )
}

/**
 * 2차 면접 심사 **유효 현황**.
 * - 활동 포기 → `withdrawn`
 * - 수동 합격/불합격/예비 → 저장값
 * - 그 외 → 배정 면접 **종료 시각** 기준 `waiting` | `completed` (저장하지 않음)
 */
export function resolveGeneralEffectiveSecondInterviewStatus(
  row: Pick<
    GeneralVolunteerApplicantRow,
    | 'interviewAssignmentStatus'
    | 'secondInterviewScreeningStatus'
    | 'assignedInterviewDateLabel'
    | 'assignedInterviewTime'
    | 'assignedInterviewStartAt'
    | 'assignedInterviewEndAt'
  >,
  now: Dayjs = dayjs()
): GeneralEffectiveSecondInterviewStatus {
  if (row.interviewAssignmentStatus === 'withdrawn') return 'withdrawn'

  const stored = row.secondInterviewScreeningStatus
  if (stored && MANUAL_SECOND_INTERVIEW_STATUSES.has(stored)) return stored

  const slotEnd = parseGeneralInterviewSlotEndFromRow(row)
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
