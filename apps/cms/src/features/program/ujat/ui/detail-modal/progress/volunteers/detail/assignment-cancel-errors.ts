import {
  getApiErrorCode,
  readApiErrorAlertMessage,
} from '@/shared/lib/extract-api-error-message'
import { ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT } from './assignment-progress-action-guards'

export const UJAT_PARTNER_ASSIGNMENT_EDUCATION_COMPLETED_CODE =
  'UJAT_PARTNER_ASSIGNMENT_EDUCATION_COMPLETED'

export const CANCELLATION_NOTIFICATION_SCHEDULED_AT_INVALID_CODE =
  'CANCELLATION_NOTIFICATION_SCHEDULED_AT_INVALID'

export const UJAT_PARTNER_ASSIGNMENT_CONFLICT_CODE = 'UJAT_PARTNER_ASSIGNMENT_CONFLICT'

export const ASSIGNMENT_CANCEL_REASON_MIN_LENGTH = 2

export const ASSIGNMENT_CANCEL_REASON_TOO_SHORT_ALERT = {
  title: '안내',
  content: '취소 사유는 2자 이상 입력해 주세요.',
} as const

export const ASSIGNMENT_CANCEL_SCHEDULED_AT_INVALID_ALERT = {
  title: '알림 발송 일시 확인',
  content: '예약 발송 시각은 현재보다 이후여야 합니다. 일시를 다시 선택해 주세요.',
} as const

export const ASSIGNMENT_CANCEL_CONFLICT_ALERT = {
  title: '배정 취소 불가 안내',
  content: '이미 취소되었거나 변경된 배정입니다. 목록을 새로고침한 뒤 다시 확인해 주세요.',
} as const

export function resolveAssignmentCancelErrorAlert(
  error: unknown
): { title: string; content: string; shouldRefresh: boolean } | null {
  const code = getApiErrorCode(error)
  if (code === UJAT_PARTNER_ASSIGNMENT_EDUCATION_COMPLETED_CODE) {
    return {
      title: ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT.title,
      content: readApiErrorAlertMessage(error, ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT.content),
      shouldRefresh: true,
    }
  }
  if (code === CANCELLATION_NOTIFICATION_SCHEDULED_AT_INVALID_CODE) {
    return { ...ASSIGNMENT_CANCEL_SCHEDULED_AT_INVALID_ALERT, shouldRefresh: false }
  }
  if (code === UJAT_PARTNER_ASSIGNMENT_CONFLICT_CODE) {
    return { ...ASSIGNMENT_CANCEL_CONFLICT_ALERT, shouldRefresh: true }
  }
  return null
}
