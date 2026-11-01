/**
 * 면접일 재배정 가능 여부 — 서버 `VOLUNTEER_INTERVIEW_CONFLICT`와 동일 계약.
 * 재배정은 배정·면접 상태가 ASSIGNED / INTERVIEW_ASSIGNED 이고 평가 0건일 때만 허용.
 * FE UI 상태 `assigned`는 EVALUATED 등도 포함하므로 API raw·점수·2차 상태로 판별한다.
 */

export const VOLUNTEER_INTERVIEW_REASSIGN_BLOCKED_ALERT = {
  title: '면접일 재배정 안내',
  content: '면접 평가가 진행·완료된 신청은 재배정할 수 없습니다.',
} as const

export const VOLUNTEER_INTERVIEW_CONFLICT_ALERT_MESSAGE =
  '면접 평가가 진행·완료된 신청은 재배정할 수 없습니다.'

/** 서버가 재배정을 거부하는 배정·면접 wire 상태 */
const REASSIGN_BLOCKED_API_STATUSES = new Set([
  'PARTIALLY_EVALUATED',
  'EVALUATED',
  'INTERVIEW_EVALUATED',
  'COMPLETED',
])

type VolunteerInterviewReassignRow = {
  interviewAssignmentStatus?: string | null
  /** 목록·상세 wire의 interviewAssignmentStatus / interviewStatus (대문자) */
  interviewAssignmentApiStatus?: string | null
  managerAScore?: number | null
  managerBScore?: number | null
  totalScore?: number | null
  secondInterviewScreeningStatus?: string | null
}

function hasSubmittedInterviewScore(score: number | null | undefined): boolean {
  return score != null && Number.isFinite(score)
}

function isReassignBlockedApiStatus(apiStatus?: string | null): boolean {
  const normalized = apiStatus?.trim().toUpperCase() ?? ''
  return normalized !== '' && REASSIGN_BLOCKED_API_STATUSES.has(normalized)
}

/** wire 필드 중 평가·완료 상태를 우선해 재배정 차단용 raw를 고른다 */
export function pickVolunteerInterviewAssignmentApiStatus(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  let assignedFallback: string | undefined
  for (const candidate of candidates) {
    const normalized = candidate?.trim().toUpperCase()
    if (!normalized) continue
    if (REASSIGN_BLOCKED_API_STATUSES.has(normalized)) return normalized
    if (
      !assignedFallback &&
      (normalized === 'ASSIGNED' || normalized === 'INTERVIEW_ASSIGNED')
    ) {
      assignedFallback = normalized
    }
  }
  return assignedFallback
}

/** 이미 면접 배정된 신청에 대해 재배정이 서버에서 허용되는지 */
export function canReassignVolunteerInterviewAssignment(
  row: VolunteerInterviewReassignRow
): boolean {
  if (row.interviewAssignmentStatus !== 'assigned') return false
  if (isReassignBlockedApiStatus(row.interviewAssignmentApiStatus)) return false
  if (
    hasSubmittedInterviewScore(row.managerAScore) ||
    hasSubmittedInterviewScore(row.managerBScore) ||
    hasSubmittedInterviewScore(row.totalScore)
  ) {
    return false
  }
  const second = row.secondInterviewScreeningStatus?.trim()
  if (second && second !== 'waiting') return false
  return true
}
