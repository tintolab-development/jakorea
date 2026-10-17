import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'

/**
 * `PATCH /api/admin/programs/{id}` — BE는 `schedules` 키가 있으면 전체 일정 교체한다.
 * CMS는 일정 변경을 전용 API·공통정보 저장 경로로만 보내야 하며, 설문·form-bindings와 함께 재전송하지 않는다.
 */
export function programUpdateRequestIncludesSchedulesPayload(
  payload: ProgramUpdateRequest
): boolean {
  return Object.prototype.hasOwnProperty.call(payload, 'schedules')
}

/** 실수로 포함된 `schedules`(빈 배열·null 포함)를 제거한다. */
export function omitSchedulesFromProgramUpdateRequest<T extends ProgramUpdateRequest>(
  payload: T
): T {
  if (!programUpdateRequestIncludesSchedulesPayload(payload)) {
    return payload
  }
  const { schedules: _removed, ...rest } = payload
  return rest as T
}
