import type { UjatDirectAssignmentResponse } from '@/features/program/ujat/api/education-execution-api'
import { getApiErrorHttpStatus, readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'

/**
 * 서버 응답이 있는 오류는 error.code별 서버 한국어 message를 그대로 쓴다
 * (UJAT_VOLUNTEER_ALREADY_ASSIGNED_SAME_DAY, UJAT_EDUCATION_SLOT_ALREADY_ASSIGNED 등).
 * 클라이언트 검증 오류(INVALID_* 등 내부 코드)는 fallback 문구를 쓴다.
 */
export function resolveRegionAssignmentErrorMessage(error: unknown, fallback: string): string {
  if (getApiErrorHttpStatus(error) == null) return fallback
  return readApiErrorAlertMessage(error, fallback)
}

export function buildDirectAssignSuccessMessage(
  response: UjatDirectAssignmentResponse | null | undefined
): string {
  if (response?.addedAsSecondary === true) {
    return '1인 배정 학급에 두 번째 봉사자가 배정되었습니다.'
  }
  if (response?.movedFromExistingPair === true) {
    return '기존 2인조에서 봉사자를 이동해 배정했습니다. 남은 학급은 1인으로 진행됩니다.'
  }
  return '교육일이 직접 배정되었습니다.'
}
