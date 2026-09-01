/**
 * 채용 안내 저장 실패 알림 매핑
 */

import {
  isOptimisticLockConflictError,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export function recruitGuideSaveFailureAlert(
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
    if (code === 'BANNER_SUB_TEXT_01_REQUIRED') {
      return { title: '입력 확인', content: '서브 텍스트 01을 입력해 주세요.' }
    }
    if (code === 'BANNER_SUB_TEXT_02_REQUIRED') {
      return { title: '입력 확인', content: '서브 텍스트 02를 입력해 주세요.' }
    }
    if (code === 'CULTURE_TITLE_REQUIRED') {
      return { title: '입력 확인', content: '타이틀을 입력해 주세요.' }
    }
    if (code === 'CULTURE_DESCRIPTION_REQUIRED') {
      return { title: '입력 확인', content: '설명 텍스트를 입력해 주세요.' }
    }
    if (code === 'INTERVIEW_DUPLICATE') {
      return { title: '중복 게시글', content: '이미 연결된 임팩트 스토리 게시글입니다.' }
    }
    if (code === 'INTERVIEW_NOT_FOUND') {
      return { title: '수정 실패', content: '선택한 직무 인터뷰 항목을 찾을 수 없습니다.' }
    }
    if (code === 'INTERVIEW_NONE_SELECTED') {
      return { title: '항목 선택', content: '선택된 항목이 없습니다.' }
    }
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
