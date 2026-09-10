/**
 * 폼 응답 피드백 등록(Wave11) 구조화 오류코드 → 사용자 문구
 * BE: POST /api/admin/form-responses/{responseId}/feedback
 */

import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

const FEEDBACK_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  FORM_RESPONSE_FEEDBACK_CONTENT_REQUIRED: '피드백 내용을 입력해 주세요.',
  FORM_RESPONSE_FEEDBACK_CONTENT_TOO_LONG: '피드백 내용은 4,000자 이하로 입력해 주세요.',
  FORM_RESPONSE_FEEDBACK_STATUS_INVALID: '제출 완료 상태의 응답에만 피드백을 등록할 수 있습니다.',
}

/** SUBMITTED가 아닌 응답(409) — 목록/상세 refetch로 CTA 재계산 필요 */
export function isFormResponseFeedbackStatusConflict(error: unknown): boolean {
  return (
    getApiErrorCode(error) === 'FORM_RESPONSE_FEEDBACK_STATUS_INVALID' ||
    getApiErrorHttpStatus(error) === 409
  )
}

export function getFormResponseFeedbackErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error)
  if (code && FEEDBACK_ERROR_MESSAGES[code]) return FEEDBACK_ERROR_MESSAGES[code]
  const status = getApiErrorHttpStatus(error)
  if (status === 409) return FEEDBACK_ERROR_MESSAGES.FORM_RESPONSE_FEEDBACK_STATUS_INVALID!
  if (status === 403) return '피드백 등록 권한이 없습니다.'
  return '피드백 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}
