/**
 * 개인후원 저장 실패 알림 매핑
 */

import {
  isOptimisticLockConflictError,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export function individualDonationSaveFailureAlert(
  error: unknown,
  fallbackContent: string
): { title: string; content: string } {
  if (error instanceof Error) {
    const code = error.message
    if (code === 'BANNER_IMAGE_REQUIRED') {
      return { title: '입력 확인', content: '배너 이미지를 등록해 주세요.' }
    }
    if (code === 'BANNER_MAIN_TEXT_REQUIRED') {
      return { title: '입력 확인', content: '메인 텍스트를 입력해 주세요.' }
    }
    if (code === 'BANNER_SUB_TEXT_REQUIRED') {
      return { title: '입력 확인', content: '서브 텍스트를 입력해 주세요.' }
    }
    if (code === 'USAGE_MAIN_TEXT_REQUIRED') {
      return { title: '입력 확인', content: '메인 텍스트를 입력해 주세요.' }
    }
    if (code === 'USAGE_SUB_TEXT_REQUIRED') {
      return { title: '입력 확인', content: '서브 텍스트를 입력해 주세요.' }
    }
    if (code === 'DONATE_LINK_REQUIRED') {
      return { title: '입력 확인', content: '연결 링크를 입력해 주세요.' }
    }
  }

  if (isOptimisticLockConflictError(error)) {
    return {
      title: '저장 실패',
      content: '다른 관리자가 내용을 수정했습니다.\n새로고침 후 다시 시도해 주세요.',
    }
  }

  const message = readApiErrorMessage(error) ?? ''
  if (/Donation URL|must use http/i.test(message)) {
    return {
      title: '연결 링크 형식 오류',
      content: '연결 링크는 http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
    }
  }
  if (/banner|Banner/i.test(message)) {
    return {
      title: '상단 배너 저장 실패',
      content: '배너 이미지·문구를 확인해 주세요.',
    }
  }
  if (/Permission is denied|FORBIDDEN/i.test(message)) {
    return {
      title: '저장 실패',
      content: '저장 권한이 없습니다. 관리자에게 문의해 주세요.',
    }
  }

  return { title: '저장 실패', content: fallbackContent }
}
