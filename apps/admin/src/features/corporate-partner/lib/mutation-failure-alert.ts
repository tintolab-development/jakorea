/**
 * 후원사 mutation 실패 알림 매핑
 */

import {
  isOptimisticLockConflictError,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export function corporatePartnerMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
): { title: string; content: string } {
  if (error instanceof Error) {
    const code = error.message
    if (code === 'NAME_REQUIRED') {
      return { title: '입력 확인', content: '기업명을 입력해 주세요.' }
    }
    if (code === 'LOGO_REQUIRED') {
      return { title: '입력 확인', content: '로고 이미지를 등록해 주세요.' }
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
    return { title: '입력 확인', content: '기업명을 확인해 주세요.' }
  }
  if (/logo|Logo|SPONSOR_LOGO/i.test(message)) {
    return { title: '입력 확인', content: '로고 이미지를 확인해 주세요.' }
  }
  if (/Permission is denied|FORBIDDEN/i.test(message)) {
    return {
      title: '저장 실패',
      content: '저장 권한이 없습니다. 관리자에게 문의해 주세요.',
    }
  }

  return { title: '저장 실패', content: fallbackContent }
}
