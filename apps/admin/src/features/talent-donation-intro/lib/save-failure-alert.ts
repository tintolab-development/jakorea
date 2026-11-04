/**
 * 재능기부 소개 저장 실패 알림 매핑
 */

import { REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'
import {
  type AdminMutationAlert,
  isOptimisticLockConflictError,
  readApiErrorCode,
  readApiErrorField,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export function talentDonationIntroSaveFailureAlert(
  error: unknown,
  fallbackContent: string
): AdminMutationAlert {
  if (error instanceof Error) {
    const code = error.message
    if (code === 'BANNER_IMAGE_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
    if (code === 'BANNER_MAIN_TEXT_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
    if (code === 'BANNER_SUB_TEXT_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
    if (code === 'HOW_TITLE_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
    if (code === 'HOW_DESCRIPTION_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
    if (code === 'INTERVIEW_MAIN_TEXT_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
    if (code === 'INTERVIEW_SUB_TEXT_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
    if (code === 'INTERVIEW_BUTTON_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
    if (code === 'INTERVIEW_POST_REQUIRED') {
      return REQUIRED_FIELDS_INCOMPLETE_ALERT
    }
  }

  if (isOptimisticLockConflictError(error)) {
    return {
      title: '저장 실패',
      content: '다른 관리자가 내용을 수정했습니다.\n새로고침 후 다시 시도해 주세요.',
    }
  }

  const message = readApiErrorMessage(error) ?? ''
  const field = readApiErrorField(error) ?? ''
  const code = readApiErrorCode(error) ?? ''
  if (
    field === 'linkedStoryId' ||
    /already used by another talent interview slot/i.test(message)
  ) {
    return {
      title: '연결 게시글 중복',
      content: '다른 인터뷰 슬롯에 이미 연결된 게시글입니다. 다른 글을 선택해 주세요.',
    }
  }
  if (code === 'IMPACT_RESOURCE_NOT_FOUND') {
    return {
      title: '저장 실패',
      content: '연결한 게시글을 찾을 수 없습니다. 다른 글을 선택해 주세요.',
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
