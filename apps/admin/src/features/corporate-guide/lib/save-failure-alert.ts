/**
 * 기업후원 안내 저장 실패 알림
 */

import {
  isOptimisticLockConflictError,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export function corporateGuideSaveFailureAlert(
  error: unknown,
  fallbackContent: string
): { title: string; content: string } {
  if (error instanceof Error) {
    const code = error.message
    const map: Record<string, { title: string; content: string }> = {
      BANNER_IMAGE_REQUIRED: { title: '입력 확인', content: '배너 이미지를 등록해 주세요.' },
      BANNER_MAIN_TEXT_REQUIRED: { title: '입력 확인', content: '메인 텍스트를 입력해 주세요.' },
      BANNER_SUB_TEXT_REQUIRED: { title: '입력 확인', content: '서브 텍스트를 입력해 주세요.' },
      METRIC_TITLE_REQUIRED: { title: '입력 확인', content: '타이틀을 입력해 주세요.' },
      METRIC_DESCRIPTION_REQUIRED: { title: '입력 확인', content: '설명을 입력해 주세요.' },
      PARTNERSHIP_TITLE_REQUIRED: { title: '입력 확인', content: '단계 제목을 입력해 주세요.' },
      PARTNERSHIP_DESCRIPTION_REQUIRED: {
        title: '입력 확인',
        content: '단계 설명을 입력해 주세요.',
      },
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
