/**
 * 재능기부 신청 mutation 실패 알림 매핑
 */

import {
  isOptimisticLockConflictError,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'
import { ADMIN_ACCESS_DENIED_ALERT } from '@/shared/lib/admin-access-denied'

export function talentDonationApplicationMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
): { title: string; content: string } {
  if (isOptimisticLockConflictError(error)) {
    return {
      title: '처리 실패',
      content: '다른 관리자가 상태를 변경했습니다.\n새로고침 후 다시 시도해 주세요.',
    }
  }

  const message = readApiErrorMessage(error) ?? ''
  if (/already confirmed|CONFIRMED/i.test(message)) {
    return {
      title: '확인 실패',
      content: '이미 확인 완료된 신청입니다.',
    }
  }
  if (/Permission is denied|FORBIDDEN|PII/i.test(message)) {
    return { ...ADMIN_ACCESS_DENIED_ALERT }
  }

  return { title: '처리 실패', content: fallbackContent }
}
