/**
 * 메인 콘텐츠 섹션 저장 실패 알림 매핑
 */

import { REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'
import {
  type AdminMutationAlert,
  mapCommonRemoteMutationFailure,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export function mainContentSaveFailureAlert(
  error: unknown,
  sectionLabel: string,
): AdminMutationAlert {
  const common = mapCommonRemoteMutationFailure(error)
  if (common) return common

  const message = readApiErrorMessage(error) ?? ''
  if (/youtubeUrl|youtube/i.test(message)) {
    return { title: '입력 확인', content: '유튜브 링크를 확인해 주세요.' }
  }
  if (/attachment|첨부|IMPACT_STORY/i.test(message)) {
    return { title: '저장 실패', content: '대표 콘텐츠 이미지를 확인해 주세요.' }
  }
  if (/cta1Url|cta2Url|cta.*url/i.test(message)) {
    return {
      title: '연결 링크 형식 오류',
      content: 'CTA 링크는 http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
    }
  }
  if (/\btitle\b/i.test(message)) {
    return REQUIRED_FIELDS_INCOMPLETE_ALERT
  }

  return {
    title: '저장 실패',
    content: `${sectionLabel} 저장에 실패했습니다. 다시 시도해 주세요.`,
  }
}
