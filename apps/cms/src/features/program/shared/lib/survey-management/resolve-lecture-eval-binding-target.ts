import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'
import { resolveLectureEvalBindingTargetContract } from '@/features/program/shared/lib/survey-management/resolve-lecture-eval-binding-target-contract'

export type LectureEvalBindingTarget =
  | {
      targetScope: 'SCHEDULE'
      targetScopeId: number
    }
  | {
      targetScope: 'PROGRAM'
      targetScopeId: null
    }

/**
 * @deprecated 일정별(SCHEDULE) 자동 바인딩. 신규 등록은 {@link resolveLectureEvalBindingTargetForCreate}.
 */
export async function resolveLectureEvalBindingTarget(
  programId: string
): Promise<Extract<LectureEvalBindingTarget, { targetScope: 'SCHEDULE' }> | null> {
  const schedules = await fetchAdminProgramSchedulesRemote(programId)
  const withId = schedules.filter(
    (item): item is typeof item & { id: number } =>
      typeof item.id === 'number' && Number.isFinite(item.id) && item.id > 0
  )
  withId.sort(
    (a, b) =>
      (a.sessionNo ?? Number.MAX_SAFE_INTEGER) - (b.sessionNo ?? Number.MAX_SAFE_INTEGER) ||
      a.id - b.id
  )
  const first = withId[0]
  if (first == null) return null
  return { targetScope: 'SCHEDULE', targetScopeId: Math.trunc(first.id) }
}

/** 강의평가 등록 — 프로그램 공통 PROGRAM 바인딩 (targetScopeId null) */
export async function resolveLectureEvalBindingTargetForCreate(
  _programId: string
): Promise<LectureEvalBindingTarget> {
  return resolveLectureEvalBindingTargetContract()
}
