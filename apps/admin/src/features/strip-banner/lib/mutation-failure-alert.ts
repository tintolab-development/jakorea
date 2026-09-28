/**
 * 띠배너 mutation 실패 알림 매핑
 */

import {
  MAX_ACTIVE_STRIP_BANNERS,
  StripBannerActiveLimitError,
} from '@/entities/strip-banner/model/types'
import {
  isEnabledLimitError,
  mapCommonRemoteMutationFailure,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

const ACTIVE_LIMIT_ALERT = {
  title: '사용 제한',
  content: `배너는 최대 ${MAX_ACTIVE_STRIP_BANNERS}개까지 동시 사용 가능합니다.`,
} as const

function isStripActiveLimit(error: unknown): boolean {
  if (
    error instanceof StripBannerActiveLimitError ||
    (error as Error)?.name === 'StripBannerActiveLimitError'
  ) {
    return true
  }
  return isEnabledLimitError(error)
}

export function stripBannerMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
  title = '저장 실패',
): { title: string; content: string } {
  if (isStripActiveLimit(error)) return { ...ACTIVE_LIMIT_ALERT }

  const common = mapCommonRemoteMutationFailure(error)
  if (common) return common

  const message = readApiErrorMessage(error) ?? ''
  if (/bannerText|banner text|배너 문구/i.test(message)) {
    return { title: '입력 확인', content: '배너 문구를 확인해 주세요.' }
  }
  if (/displayStartDate|displayEndDate|게시 기간|period/i.test(message)) {
    return { title: '입력 확인', content: '게시 기간을 확인해 주세요.' }
  }
  if (/linkUrl|link url|https?:\/\//i.test(message) && /invalid|형식|url/i.test(message)) {
    return {
      title: '연결 링크 형식 오류',
      content: '연결 링크는 http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
    }
  }

  return { title, content: fallbackContent }
}
