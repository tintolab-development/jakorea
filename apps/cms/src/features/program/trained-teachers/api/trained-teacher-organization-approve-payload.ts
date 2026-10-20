/** 교육받은 교사 기관 승인 API의 payload 규칙. */

export type TrainedTeacherApproveTiming = 'IMMEDIATE' | 'SCHEDULED' | 'ON_ANNOUNCEMENT'

export type TrainedTeacherApproveRequest = {
  timing?: TrainedTeacherApproveTiming
  scheduledAt?: string
  selectedScheduleId?: number
  slots?: Array<{ scheduleId: number }>
}

function uniquePositiveScheduleIds(ids: readonly (number | null | undefined)[]): number[] {
  const unique: number[] = []
  const seen = new Set<number>()

  for (const value of ids) {
    if (!Number.isInteger(value) || value == null || value <= 0) continue
    const id = Math.trunc(value)
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(id)
  }

  return unique
}

/**
 * TT 승인 payload를 만든다.
 *
 * - 일정이 없고 IMMEDIATE면 undefined를 반환해 기존 무본문 승인을 유지한다.
 * - 단일 일정은 selectedScheduleId만, 복수 일정은 slots만 만든다.
 * - requestedScheduleId는 이 함수의 입력·출력에 포함하지 않는다.
 * - scheduledAt은 SCHEDULED일 때만 포함한다.
 */
export function buildTrainedTeacherApproveRequest(input: {
  timing?: TrainedTeacherApproveTiming | null
  scheduledAt?: string | null
  selectedScheduleId?: number | null
  selectedScheduleIds?: readonly (number | null | undefined)[] | null
}): TrainedTeacherApproveRequest | undefined {
  const ids = uniquePositiveScheduleIds(
    input.selectedScheduleIds != null ? input.selectedScheduleIds : [input.selectedScheduleId]
  )
  const timing = input.timing ?? undefined
  const scheduledAt = input.scheduledAt?.trim()
  const request: TrainedTeacherApproveRequest = {
    ...(timing && !(timing === 'IMMEDIATE' && ids.length === 0) ? { timing } : {}),
    ...(timing === 'SCHEDULED' && scheduledAt ? { scheduledAt } : {}),
  }

  if (ids.length > 1) {
    request.slots = ids.map(scheduleId => ({ scheduleId }))
  } else if (ids.length === 1) {
    request.selectedScheduleId = ids[0]
  }

  return Object.keys(request).length > 0 ? request : undefined
}
