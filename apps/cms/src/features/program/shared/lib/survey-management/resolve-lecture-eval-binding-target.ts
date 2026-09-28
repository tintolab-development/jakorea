import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'

export type LectureEvalBindingTarget = {
  targetScope: 'SCHEDULE'
  targetScopeId: number
}

/**
 * 강의평가 바인딩은 프로그램 단위가 아니라 교육 일정(회차)이 필수다.
 * 등록 화면은 회차를 고르지 않으므로 가장 앞 회차에 연결한다.
 */
export async function resolveLectureEvalBindingTarget(
  programId: string
): Promise<LectureEvalBindingTarget | null> {
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
