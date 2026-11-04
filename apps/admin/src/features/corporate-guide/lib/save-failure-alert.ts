/**
 * 기업후원 안내 저장 실패 알림
 */

import { REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'
import {
  type AdminMutationAlert,
  isOptimisticLockConflictError,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export function corporateGuideSaveFailureAlert(
  error: unknown,
  fallbackContent: string
): AdminMutationAlert {
  if (error instanceof Error) {
    const code = error.message
    const map: Record<string, AdminMutationAlert> = {
      BANNER_IMAGE_REQUIRED: REQUIRED_FIELDS_INCOMPLETE_ALERT,
      BANNER_MAIN_TEXT_REQUIRED: REQUIRED_FIELDS_INCOMPLETE_ALERT,
      BANNER_SUB_TEXT_REQUIRED: REQUIRED_FIELDS_INCOMPLETE_ALERT,
      METRIC_TITLE_REQUIRED: REQUIRED_FIELDS_INCOMPLETE_ALERT,
      METRIC_DESCRIPTION_REQUIRED: REQUIRED_FIELDS_INCOMPLETE_ALERT,
      PARTNERSHIP_TITLE_REQUIRED: REQUIRED_FIELDS_INCOMPLETE_ALERT,
      PARTNERSHIP_DESCRIPTION_REQUIRED: REQUIRED_FIELDS_INCOMPLETE_ALERT,
    }
    if (map[code]) return map[code]!
  }
  if (isOptimisticLockConflictError(error)) {
    return {
      title: '저장 실패',
      content: '다른 관리자가 내용을 수정했습니다.\n새로고침 후 다시 시도해 주세요.',
    }
  }
  const message = readApiErrorMessage(error) ?? ''
  if (/Permission is denied|FORBIDDEN/i.test(message)) {
    return {
      title: '저장 실패',
      content: '저장 권한이 없습니다. 관리자에게 문의해 주세요.',
    }
  }
  return { title: '저장 실패', content: fallbackContent }
}
