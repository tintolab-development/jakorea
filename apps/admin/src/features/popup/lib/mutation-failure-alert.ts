/**
 * 팝업 mutation 실패 알림 매핑
 */

import { MAX_ACTIVE_POPUPS, PopupActiveLimitError } from '@/entities/popup/model/types'
import { mapAdminMutationAlert, REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'
import {
  type AdminMutationAlert,
  isEnabledLimitError,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

const ACTIVE_LIMIT_ALERT = {
  title: '사용 제한',
  content: `팝업은 최대 ${MAX_ACTIVE_POPUPS}개까지 동시 사용 가능합니다.`,
} as const

function isPopupActiveLimit(error: unknown): boolean {
  if (error instanceof PopupActiveLimitError || (error as Error)?.name === 'PopupActiveLimitError') {
    return true
  }
  return isEnabledLimitError(error)
}

export function popupMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
  title = '저장 실패',
): AdminMutationAlert {
  if (isPopupActiveLimit(error)) return { ...ACTIVE_LIMIT_ALERT }

  const common = mapAdminMutationAlert(error)
  if (common) return common

  if (error instanceof Error) {
    if (/팝업 이미지를 등록|이미지 asset/.test(error.message)) {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
  }

  const message = readApiErrorMessage(error) ?? ''
  if (/image|asset|Image/i.test(message) && /required|등록|없/i.test(message)) {
    return REQUIRED_FIELDS_INCOMPLETE_ALERT
  }
  if (/popupName|popup name/i.test(message)) {
    return REQUIRED_FIELDS_INCOMPLETE_ALERT
  }
  if (/altText|alt text|대체 텍스트/i.test(message)) {
    return REQUIRED_FIELDS_INCOMPLETE_ALERT
  }
  if (/linkUrl|link url|https?:\/\//i.test(message) && /invalid|형식|url/i.test(message)) {
    return {
      title: '연결 링크 형식 오류',
      content: '연결 링크는 http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
    }
  }

  return { title, content: fallbackContent }
}
