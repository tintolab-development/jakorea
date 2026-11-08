/**
 * 일반 프로그램 진행현황 — 참여자·봉사자 활동 포기 전 「실제 배정 일정」 검증 (공통).
 *
 * 배정 일정 판단 소스 (프로그램 전체 일정·선택 가능한 일정은 배정 일정으로 보지 않는다):
 * - 참여자(개인): GET …/participants/{participantId}/education-scope 의 `scheduleIds`
 *   (BE 계약상 개인 배정 SSOT)
 * - 봉사자: 참여자 목록 GET …/participants `sessions[].resolvedScheduleId`
 *   (BE 계약: 해당 참여자에 실제 배정된 프로그램 일정만 반환, 봉사 배정 포함)
 *
 * 배정 일정이 없으면 활동 포기 API를 호출하지 않는다
 * (BE 409 GIVE_UP_STOP_SCHEDULE_NOT_IN_PARTICIPANT_SCOPE 사전 차단 — BE 검증 자체는 우회하지 않음).
 */

import type { ParticipantEducationScopeResponse } from '@/features/program/general/api/program-progress-api-client'

export const ACTIVITY_WITHDRAW_NO_ASSIGNED_SCHEDULE_ALERT = {
  title: '활동 포기 안내',
  content: '배정된 일정이 없는 경우 활동 포기가 불가합니다.',
} as const

export const ACTIVITY_WITHDRAW_ASSIGNED_SCHEDULE_LOADING_ALERT = {
  title: '활동 포기 안내',
  content: '배정 일정을 확인하는 중입니다. 잠시 후 다시 시도해 주세요.',
} as const

export const ACTIVITY_WITHDRAW_ASSIGNED_SCHEDULE_ERROR_ALERT = {
  title: '활동 포기 안내',
  content: '배정 일정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
} as const

export type ActivityWithdrawAssignedScheduleQueryState = {
  isPending: boolean
  isError: boolean
  data: ParticipantEducationScopeResponse | undefined
}

export type ActivityWithdrawAssignedScheduleStatus = 'loading' | 'error' | 'none' | 'assigned'

/** education-scope 응답 → 실제 배정 일정 id 집합 (유효한 양의 정수만) */
export function readAssignedScheduleIds(
  scope: ParticipantEducationScopeResponse | undefined
): Set<number> {
  const ids = new Set<number>()
  for (const raw of scope?.scheduleIds ?? []) {
    const id = Number(raw)
    if (Number.isInteger(id) && id > 0) ids.add(id)
  }
  return ids
}

/** 목록 `sessions[]`(실제 배정 일정만) → 배정 일정 id 집합. 미확정 희망 일정은 제외 */
export function readAssignedScheduleIdsFromSessions(
  sessions: ReadonlyArray<{
    resolvedScheduleId?: string | number | null
    scheduleUnresolved?: boolean | null
  }>
): Set<number> {
  const ids = new Set<number>()
  for (const session of sessions) {
    if (session.scheduleUnresolved === true) continue
    const id = Number(session.resolvedScheduleId)
    if (session.resolvedScheduleId != null && Number.isInteger(id) && id > 0) ids.add(id)
  }
  return ids
}

/**
 * 조회 상태 → 배정 여부.
 * 로딩 중·조회 실패는 「배정 없음」으로 보지 않는다.
 */
export function resolveActivityWithdrawAssignedScheduleStatus(
  query: ActivityWithdrawAssignedScheduleQueryState
): ActivityWithdrawAssignedScheduleStatus {
  if (query.isError) return 'error'
  if (query.isPending || query.data === undefined) return 'loading'
  return readAssignedScheduleIds(query.data).size > 0 ? 'assigned' : 'none'
}

/** 활동 포기 진행 불가 안내. 배정 일정이 있으면 null (기존 프로세스 진행) */
export function activityWithdrawAssignedScheduleBlockAlert(
  status: ActivityWithdrawAssignedScheduleStatus
): { title: string; content: string } | null {
  switch (status) {
    case 'assigned':
      return null
    case 'none':
      return ACTIVITY_WITHDRAW_NO_ASSIGNED_SCHEDULE_ALERT
    case 'loading':
      return ACTIVITY_WITHDRAW_ASSIGNED_SCHEDULE_LOADING_ALERT
    case 'error':
      return ACTIVITY_WITHDRAW_ASSIGNED_SCHEDULE_ERROR_ALERT
  }
}

/**
 * 활동 포기 중단 일정 후보를 실제 배정 일정으로 제한한다.
 * 일정 id(resolvedScheduleId)가 확인되고 배정 범위 밖인 일정만 제외 —
 * id 미확인 일정은 기존처럼 stopScheduleId 없이 처리되므로 그대로 둔다.
 */
export function filterSessionsToAssignedSchedules<
  T extends { resolvedScheduleId?: string | number | null },
>(sessions: ReadonlyArray<T>, assignedScheduleIds: ReadonlySet<number>): T[] {
  return sessions.filter(session => {
    const raw = session.resolvedScheduleId
    if (raw == null || String(raw).trim() === '') return true
    const id = Number(raw)
    if (!Number.isFinite(id)) return true
    return assignedScheduleIds.has(id)
  })
}
