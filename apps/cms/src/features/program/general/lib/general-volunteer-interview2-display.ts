import dayjs, { type Dayjs } from 'dayjs'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
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

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 배정 면접 일정 — `26년 3월 30일 (목) 09:00 ~ 09:30` */
export function formatGeneralAssignedInterviewScheduleDisplay(
  row: Pick<GeneralVolunteerApplicantRow, 'assignedInterviewDateLabel' | 'assignedInterviewTime'>
): string {
  const dateLabel = row.assignedInterviewDateLabel?.trim()
  const timeRange = row.assignedInterviewTime?.trim()
  if (!dateLabel || !timeRange) return '-'

  const date = parseInterviewDisplayDateLabel(dateLabel)
  const slot = normalizeTimeRangeKey(timeRange)
  if (!date) return `${dateLabel} ${slot}`

  const y = date.year() % 100
  const m = date.month() + 1
  const d = date.date()
  const weekday = WEEKDAY_KO[date.day()]
  return `${y}년 ${m}월 ${d}일 (${weekday}) ${slot}`
}

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

    const slotEnd = parseGeneralInterviewSlotEnd(
      row.assignedInterviewDateLabel,
      row.assignedInterviewTime
    )
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
