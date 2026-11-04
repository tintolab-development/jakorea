/**
 * 후원사 mutation 실패 알림 매핑
 */

import { REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'
import {
  type AdminMutationAlert,
  isOptimisticLockConflictError,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export function corporatePartnerMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
): AdminMutationAlert {
  if (error instanceof Error) {
    const code = error.message
    if (code === 'NAME_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
    if (code === 'LOGO_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
  }

  if (isOptimisticLockConflictError(error)) {
    return {
      title: '저장 실패',
      content: '다른 관리자가 내용을 수정했습니다.\n새로고침 후 다시 시도해 주세요.',
    }
  }

  const message = readApiErrorMessage(error) ?? ''
  if (/company name|companyName/i.test(message)) {
    return REQUIRED_FIELDS_INCOMPLETE_ALERT
  }
  if (/logo|Logo|SPONSOR_LOGO/i.test(message)) {
    return REQUIRED_FIELDS_INCOMPLETE_ALERT
  }
  if (/Permission is denied|FORBIDDEN/i.test(message)) {
    return {
      title: '저장 실패',
      content: '저장 권한이 없습니다. 관리자에게 문의해 주세요.',
    }
  }

  return { title: '저장 실패', content: fallbackContent }
}
