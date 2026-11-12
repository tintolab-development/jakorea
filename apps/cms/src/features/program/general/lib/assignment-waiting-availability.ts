/**
 * 개인형 강사 배정 대기 — 서버 `education-scope` `schedules[].availabilityStatus` 로 배정 불가를 표시한다.
 * FE는 날짜 겹침을 계산하지 않는다. 값이 없으면(봉사자·기관형·구버전 BE) 판단하지 않는다.
 */

/** 같은 날짜(Asia/Seoul)에 같은 강사가 다른 일정에 이미 배정됨 */
export const INSTRUCTOR_ASSIGNMENT_SAME_DAY_CONFLICT = 'INSTRUCTOR_ASSIGNMENT_SAME_DAY_CONFLICT'

export type WaitingScheduleAvailability = {
  scheduleId: number
  availabilityStatus?: 'AVAILABLE' | 'UNAVAILABLE' | null
  unavailableReason?: string | null
}

/**
 * 서버가 이 일정을 배정 불가로 내려줬는지.
 * 사유 코드는 표시 문구가 기획 확정 전이라 라벨에 쓰지 않는다 — 알 수 없는 사유여도 '배정 불가'.
 */
export function isWaitingScheduleUnavailableByServer(
  availability: readonly WaitingScheduleAvailability[] | null | undefined,
  scheduleId: string | number | null | undefined
): boolean {
  if (scheduleId == null || scheduleId === '') return false
  const key = String(scheduleId)
  const hit = (availability ?? []).find(
    row => row?.scheduleId != null && String(row.scheduleId) === key
  )
  return hit?.availabilityStatus === 'UNAVAILABLE'
}
