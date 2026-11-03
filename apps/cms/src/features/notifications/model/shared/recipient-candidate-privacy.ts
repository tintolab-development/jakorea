import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import {
  isAuditLogUnavailableError,
  isForbiddenApiError,
} from '@/shared/lib/privacy-audit-error'

export type RecipientCandidatePrivacyFailure = 'forbidden' | 'audit-unavailable'

export const RECIPIENT_CANDIDATE_AUDIT_UNAVAILABLE_MESSAGE =
  '개인정보 조회 기록을 저장하지 못해 수신자 정보를 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.'

export const RECIPIENT_CANDIDATE_FORBIDDEN_MESSAGE = '수신자 정보를 조회할 권한이 없습니다.'

export function readRecipientCandidatePrivacyFailure(
  error: unknown
): RecipientCandidatePrivacyFailure | null {
  if (!error) return null
  if (isAuditLogUnavailableError(error)) return 'audit-unavailable'
  if (isForbiddenApiError(error)) return 'forbidden'
  return null
}

export function recipientCandidatePrivacyMessage(
  failure: RecipientCandidatePrivacyFailure
): string {
  return failure === 'audit-unavailable'
    ? RECIPIENT_CANDIDATE_AUDIT_UNAVAILABLE_MESSAGE
    : RECIPIENT_CANDIDATE_FORBIDDEN_MESSAGE
}

export function recipientCandidateErrorNotice(error: unknown): string {
  const failure = readRecipientCandidatePrivacyFailure(error)
  if (failure) return recipientCandidatePrivacyMessage(failure)
  return getNotificationsApiErrorMessage(error, '수신자 후보를 불러오지 못했습니다.')
}
