/**
 * 소셜 링크 mutation 실패 알림 매핑
 */

import { SocialLinkMinActiveError } from '@/entities/social-link/model/types'
import {
  type AdminMutationAlert,
  isMinActiveRequiredError,
  mapCommonRemoteMutationFailure,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'
import { minActiveRequiredAlert } from '@/shared/lib/min-active-guard'

const MIN_ACTIVE_ALERT = minActiveRequiredAlert('소셜 링크는')

export function socialLinkMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
  title = '저장 실패',
): AdminMutationAlert {
  const common = mapCommonRemoteMutationFailure(error)
  if (common) return common

  if (
    error instanceof SocialLinkMinActiveError ||
    (error as Error)?.name === 'SocialLinkMinActiveError' ||
    isMinActiveRequiredError(error)
  ) {
    return { ...MIN_ACTIVE_ALERT }
  }

  const message = readApiErrorMessage(error) ?? ''
  if (/externalUrl|external url|https?:\/\//i.test(message) && /invalid|형식|url/i.test(message)) {
    return {
      title: '연결 링크 형식 오류',
      content: '연결 링크는 http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
    }
  }

  return { title, content: fallbackContent }
}
