import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { resolveRegionAssignmentErrorMessage } from './region-assignment-messages'

const UNAVAILABILITY_ERROR_MESSAGES: Record<string, string> = {
  UJAT_REPLACEMENT_PARTICIPANT_REQUIRED:
    '배정된 교육이 있는 날짜에는 대체 봉사자를 선택해 주세요.',
  UJAT_REPLACEMENT_PARTICIPANT_NOT_ALLOWED:
    '선택한 교육일에는 배정이 없어 대체가 필요 없습니다. 대체 봉사자 선택을 해제한 뒤 다시 시도해 주세요.',
  UJAT_REPLACEMENT_PARTICIPANT_SAME_AS_SOURCE:
    '대체 봉사자는 참여 불가로 지정한 봉사자와 같을 수 없습니다.',
  UJAT_REPLACEMENT_ALREADY_ASSIGNED_SAME_DAY:
    '선택한 대체 봉사자는 해당 교육일에 이미 다른 학급에 배정되어 있습니다.',
  UJAT_REPLACEMENT_UNAVAILABLE_SAME_DAY:
    '선택한 대체 봉사자는 해당 교육일에 활동 불가로 등록되어 있습니다.',
}

export function resolveRegionUnavailabilityErrorMessage(error: unknown, fallback: string): string {
  if (getApiErrorHttpStatus(error) == null) {
    if (error instanceof Error && error.message === 'REPLACEMENT_REQUIRED') {
      return UNAVAILABILITY_ERROR_MESSAGES.UJAT_REPLACEMENT_PARTICIPANT_REQUIRED
    }
    return fallback
  }
  const code = getApiErrorCode(error)
  if (code && UNAVAILABILITY_ERROR_MESSAGES[code]) {
    return UNAVAILABILITY_ERROR_MESSAGES[code]
  }
  return resolveRegionAssignmentErrorMessage(error, fallback)
}
