/**
 * 히어로 배너 mutation 실패 알림 매핑
 */

import { HeroBannerMinActiveError } from '@/entities/hero-banner/model/types'
import {
  type AdminMutationAlert,
  isMinActiveRequiredError,
  mapCommonRemoteMutationFailure,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'
import { minActiveRequiredAlert } from '@/shared/lib/min-active-guard'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'

const MIN_ACTIVE_ALERT = minActiveRequiredAlert('히어로 배너는')

export function heroBannerMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
  title = '저장 실패',
): AdminMutationAlert {
  const common = mapCommonRemoteMutationFailure(error)
  if (common) return common

  if (
    error instanceof HeroBannerMinActiveError ||
    (error as Error)?.name === 'HeroBannerMinActiveError' ||
    isMinActiveRequiredError(error)
  ) {
    return { ...MIN_ACTIVE_ALERT }
  }

  if (error instanceof Error) {
    if (/배너 이미지를 등록|이미지 asset/.test(error.message)) {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
  }

  const message = readApiErrorMessage(error) ?? ''
  if (/image|asset|Image/i.test(message) && /required|등록|없/i.test(message)) {
    return REQUIRED_FIELDS_INCOMPLETE_ALERT
  }
  if (/mainTitle|main title|메인 타이틀/i.test(message)) {
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
