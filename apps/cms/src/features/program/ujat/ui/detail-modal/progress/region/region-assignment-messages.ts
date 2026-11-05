import type { UjatDirectAssignmentResponse } from '@/features/program/ujat/api/education-execution-api'
import {
  getApiErrorCode,
  getApiErrorHttpStatus,
  readApiErrorAlertMessage,
} from '@/shared/lib/extract-api-error-message'

const REGION_ASSIGNMENT_ERROR_MESSAGES: Record<string, string> = {
  UJAT_VOLUNTEER_ALREADY_ASSIGNED_SAME_DAY: '같은 날 이미 다른 학급에 배정된 봉사자입니다.',
  UJAT_EDUCATION_SLOT_ALREADY_ASSIGNED:
    '해당 교육일·학급에는 이미 봉사자 2명이 배정되어 있습니다.',
  UJAT_REGION_VOLUNTEER_CAPACITY_EXCEEDED:
    '해당 지역 봉사자 정원을 초과할 수 있어 배정할 수 없습니다.',
  UJAT_PARTNER_ASSIGNMENT_CONFLICT:
    '다른 관리자가 같은 학급을 배정했습니다. 배정표를 새로고침해 주세요.',
  UJAT_EDUCATION_SLOT_NOT_FOUND:
    '배정할 수 있는 학급이 아닙니다. 일정이 지났거나 확정되지 않았을 수 있습니다.',
  UJAT_EDUCATION_SLOT_NOT_ASSIGNED: '아직 배정되지 않은 학급입니다. 배정표를 새로고침해 주세요.',
  UJAT_ATTENDANCE_MANAGER_NOT_ASSIGNED:
    '해당 교육일에 배정된 봉사자만 지정할 수 있습니다.',
}

function hasHangul(value: string): boolean {
  return /[\uAC00-\uD7A3]/.test(value)
}

/**
 * 서버 응답이 한국어면 그대로 쓴다.
 * error.code만 있거나 영어/코드 문자열이면 지역 배정용 한국어로 치환한다.
 * 클라이언트 검증 오류(INVALID_* 등 내부 코드)는 fallback 문구를 쓴다.
 */
export function resolveRegionAssignmentErrorMessage(error: unknown, fallback: string): string {
  if (getApiErrorHttpStatus(error) == null) return fallback
  const code = getApiErrorCode(error)
  const mapped = code ? REGION_ASSIGNMENT_ERROR_MESSAGES[code] : undefined
  const serverMessage = readApiErrorAlertMessage(error, fallback)
  if (mapped && (!serverMessage || serverMessage === code || !hasHangul(serverMessage))) {
    return mapped
  }
  if (serverMessage === code && fallback) return fallback
  return serverMessage
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
